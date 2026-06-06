const express = require('express');
const { protect, adminOnly, mentorOrAdmin } = require('../middleware/auth');
const SubPhase = require('../models/SubPhase');
const ApprovalRequest = require('../models/ApprovalRequest');
const Phase = require('../models/Phase');
const Progress = require('../models/Progress');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Reflection = require('../models/Reflection');
const { sendEmail, getStatusUpdateTemplate, getReflectionReadyTemplate } = require('../services/emailService');
const { logAction } = require('../services/auditService');

const router = express.Router();

// ===== SUBPHASE CRUD ROUTES =====

// Get all sub-phases for a phase
router.get('/phases/:phaseId/subphases', protect, async (req, res) => {
  try {
    const subPhases = await SubPhase.find({ phaseId: req.params.phaseId })
      .populate('createdBy', 'name email')
      .sort({ order: 1 });
    res.json(subPhases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create sub-phase
router.post('/phases/:phaseId/subphases', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { id, title, description, order, requirements } = req.body;
    if (!id || !title || !description || order === undefined)
      return res.status(400).json({ message: 'All required fields must be provided' });

    const exists = await SubPhase.findOne({ phaseId: req.params.phaseId, id });
    if (exists) return res.status(400).json({ message: 'Sub-phase ID already exists in this phase' });

    const subPhase = await SubPhase.create({
      phaseId: req.params.phaseId,
      id: id.toLowerCase(),
      title,
      description,
      order,
      requirements: requirements || {},
      createdBy: req.user._id
    });

    const orderedSubPhases = await SubPhase.find({ phaseId: req.params.phaseId }).sort({ order: 1 });
    const allProgress = await Progress.find({ 'phases.phaseId': req.params.phaseId });
    for (const progress of allProgress) {
      const phaseProgress = progress.phases.find(p => p.phaseId === req.params.phaseId);
      if (phaseProgress) {
        phaseProgress.subPhases = orderedSubPhases.map((sp, index) => {
          const existing = phaseProgress.subPhases?.find(item => item.subPhaseId === sp.id);
          return existing || {
            subPhaseId: sp.id,
            status: index === 0 ? 'unlocked' : 'locked',
            approvalRequested: false,
            approvalStatus: null
          };
        });
        progress.updatedAt = new Date();
        await progress.save();
      }
    }

    await logAction(req.user._id, 'subphase_created', req.ip, { phaseId: req.params.phaseId, subPhaseId: subPhase.id });
    res.status(201).json(subPhase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update sub-phase
router.put('/subphases/:subPhaseId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { title, description, order, requirements } = req.body;
    const subPhase = await SubPhase.findByIdAndUpdate(
      req.params.subPhaseId,
      { title, description, order, requirements, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!subPhase) return res.status(404).json({ message: 'Sub-phase not found' });
    await logAction(req.user._id, 'subphase_updated', req.ip, { subPhaseId: subPhase.id });
    res.json(subPhase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete sub-phase
router.delete('/subphases/:subPhaseId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const subPhase = await SubPhase.findByIdAndDelete(req.params.subPhaseId);
    if (!subPhase) return res.status(404).json({ message: 'Sub-phase not found' });
    
    // Delete all approval requests for this sub-phase
    await ApprovalRequest.deleteMany({ subPhaseId: subPhase.id });
    await logAction(req.user._id, 'subphase_deleted', req.ip, { subPhaseId: subPhase.id });
    res.json({ message: 'Sub-phase deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reorder sub-phases
router.post('/phases/:phaseId/subphases/reorder', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id: subPhase._id, order: newOrder }
    if (!Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates must be an array' });
    }

    for (const update of updates) {
      await SubPhase.findByIdAndUpdate(update.id, { order: update.order, updatedAt: new Date() });
    }

    await logAction(req.user._id, 'subphase_reordered', req.ip, { phaseId: req.params.phaseId });
    res.json({ message: 'Sub-phases reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== APPROVAL REQUEST ROUTES =====

// Get draft submission
router.get('/draft/:phaseId/:subPhaseId', protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({
      student: req.user._id,
      phaseId: req.params.phaseId,
      subPhaseId: req.params.subPhaseId,
      status: 'draft'
    });
    res.json(submission || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save draft submission
router.post('/draft', protect, async (req, res) => {
  try {
    const { phaseId, subPhaseId, submissionMessage, githubLink, deploymentLink, videoLink, attachments } = req.body;
    if (!phaseId || !subPhaseId) return res.status(400).json({ message: 'Phase and Sub-phase required' });

    let submission = await Submission.findOne({
      student: req.user._id,
      phaseId,
      subPhaseId,
      status: 'draft'
    });

    if (submission) {
      submission.submissionMessage = submissionMessage || '';
      submission.githubLink = githubLink || '';
      submission.deploymentLink = deploymentLink || '';
      submission.videoLink = videoLink || '';
      submission.reflection = submissionMessage || '';
      submission.attachments = attachments || [];
      submission.updatedAt = new Date();
      await submission.save();
    } else {
      submission = await Submission.create({
        student: req.user._id,
        phaseId,
        subPhaseId,
        submissionMessage: submissionMessage || '',
        githubLink: githubLink || '',
        deploymentLink: deploymentLink || '',
        videoLink: videoLink || '',
        reflection: submissionMessage || '',
        attachments: attachments || [],
        status: 'draft'
      });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student requests approval for completing a sub-phase
router.post('/approval-request', protect, async (req, res) => {
  try {
    const { phaseId, subPhaseId, submissionMessage, githubLink, deploymentLink, videoLink, attachments } = req.body;
    if (!phaseId || !subPhaseId) {
      return res.status(400).json({ message: 'Phase and Sub-phase required' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit approval requests' });
    }

    const subPhases = await SubPhase.find({ phaseId }).sort({ order: 1 });
    const subPhaseIndex = subPhases.findIndex(sp => sp.id === subPhaseId);
    if (subPhaseIndex === -1) {
      return res.status(404).json({ message: 'Sub-phase not found' });
    }
    const selectedSubPhase = subPhases[subPhaseIndex];
    const requirements = selectedSubPhase.requirements || {};
    if (requirements.githubRequired && !githubLink) {
      return res.status(400).json({ message: 'GitHub link is required for this sub-phase' });
    }
    if (requirements.deploymentRequired && !deploymentLink) {
      return res.status(400).json({ message: 'Deployment link is required for this sub-phase' });
    }
    if (requirements.videoRequired && !videoLink) {
      return res.status(400).json({ message: 'Video link is required for this sub-phase' });
    }
    if (requirements.reflectionRequired && !submissionMessage) {
      return res.status(400).json({ message: 'Reflection is required for this sub-phase' });
    }

    const progress = await Progress.findOne({ user: req.user._id });
    const phaseProgress = progress?.phases.find(p => p.phaseId === phaseId);
    if (!phaseProgress || phaseProgress.status === 'locked' || phaseProgress.status === 'completed') {
      return res.status(403).json({ message: 'This phase is not available for submission' });
    }

    if (!phaseProgress.subPhases || phaseProgress.subPhases.length === 0) {
      phaseProgress.subPhases = subPhases.map((sp, index) => ({
        subPhaseId: sp.id,
        status: index === 0 ? 'unlocked' : 'locked',
        approvalRequested: false,
        approvalStatus: null
      }));
      await progress.save();
    }

    const currentSubPhaseProgress = phaseProgress.subPhases.find(sp => sp.subPhaseId === subPhaseId);
    const previousSubPhaseProgress = subPhaseIndex > 0
      ? phaseProgress.subPhases.find(sp => sp.subPhaseId === subPhases[subPhaseIndex - 1].id)
      : null;

    const canSubmit = subPhaseIndex === 0 || previousSubPhaseProgress?.status === 'completed';
    if (!canSubmit || currentSubPhaseProgress?.status === 'completed') {
      return res.status(403).json({ message: 'Complete the previous sub-phase before submitting this one' });
    }

    const exists = await ApprovalRequest.findOne({
      student: req.user._id,
      phaseId,
      subPhaseId,
      status: 'pending'
    });

    if (exists) return res.status(400).json({ message: 'Approval request already pending' });

    const request = await ApprovalRequest.create({
      student: req.user._id,
      phaseId,
      subPhaseId,
      type: 'subphase',
      submissionMessage: submissionMessage || '',
      githubLink: githubLink || '',
      deploymentLink: deploymentLink || '',
      videoLink: videoLink || '',
      attachments: attachments || [],
      status: 'pending'
    });

    await Submission.create({
      student: req.user._id,
      phaseId,
      subPhaseId,
      submissionMessage,
      githubLink: githubLink || '',
      deploymentLink: deploymentLink || '',
      videoLink: videoLink || '',
      reflection: submissionMessage || '',
      attachments: attachments || [],
      approvalRequest: request._id,
      status: 'pending'
    });

    // Update student's progress document subphase item status to pending
    if (progress) {
      if (phaseProgress) {
        let subPhaseProgress = phaseProgress.subPhases.find(sp => sp.subPhaseId === subPhaseId);
        if (!subPhaseProgress) {
          // Initialize if not present
          phaseProgress.subPhases = subPhases.map(sp => ({
            subPhaseId: sp.id,
            status: sp.id === subPhaseId ? 'unlocked' : 'locked',
            approvalRequested: sp.id === subPhaseId,
            approvalStatus: sp.id === subPhaseId ? 'pending' : null
          }));
        } else {
          subPhaseProgress.approvalRequested = true;
          subPhaseProgress.approvalStatus = 'pending';
        }
        await progress.save();
      }
    }

    // Log action
    await logAction(req.user._id, 'subphase_submitted', req.ip, { phaseId, subPhaseId });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mentor gets all pending approval requests
router.get('/approval-requests/pending', protect, mentorOrAdmin, async (req, res) => {
  try {
    const requests = await ApprovalRequest.find({ status: 'pending' })
      .populate('student', 'name email house')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mentor approves or rejects approval request
router.post('/approval-request/:requestId/respond', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { approve, approvalMessage } = req.body;
    const request = await ApprovalRequest.findById(req.params.requestId)
      .populate('student', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    const newStatus = approve ? 'approved' : 'rejected';
    request.status = newStatus;
    request.approvalMessage = approvalMessage || '';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    await Submission.updateMany(
      { approvalRequest: request._id },
      {
        status: newStatus,
        reviewedBy: req.user._id,
        reviewedAt: request.approvedAt,
        feedback: approvalMessage || '',
        updatedAt: new Date()
      }
    );

    // Update student's sub-phase status in Progress
    const progress = await Progress.findOne({ user: request.student._id });
    if (progress) {
      const phaseProgress = progress.phases.find(p => p.phaseId === request.phaseId);
      if (phaseProgress) {
        const subPhaseProgress = phaseProgress.subPhases.find(sp => sp.subPhaseId === request.subPhaseId);
        if (subPhaseProgress) {
          if (approve) {
            subPhaseProgress.status = 'completed';
            subPhaseProgress.approvalStatus = 'approved';
            subPhaseProgress.completedAt = new Date();

            const orderedSubPhases = await SubPhase.find({ phaseId: request.phaseId }).sort({ order: 1 });
            const completedIndex = orderedSubPhases.findIndex(sp => sp.id === request.subPhaseId);
            const nextSubPhase = orderedSubPhases[completedIndex + 1];
            if (nextSubPhase) {
              const nextProgress = phaseProgress.subPhases.find(sp => sp.subPhaseId === nextSubPhase.id);
              if (nextProgress && nextProgress.status === 'locked') {
                nextProgress.status = 'unlocked';
              }
            }
          } else {
            subPhaseProgress.status = 'unlocked';
            subPhaseProgress.approvalStatus = 'rejected';
            subPhaseProgress.approvalRequested = false;
          }
        }

        // Check if all sub-phases are completed
        const allCompleted = phaseProgress.subPhases.length > 0 && phaseProgress.subPhases.every(sp => sp.status === 'completed');
        if (approve && allCompleted) {
          phaseProgress.reflectionStatus = 'ready-for-review';
          phaseProgress.reflection1Status = 'ready';
          phaseProgress.finalReflectionStatus = phaseProgress.finalReflectionStatus || 'not-ready';
          
          // Send Reflection Ready email to student
          await sendEmail({
            to: request.student.email,
            subject: `Reflection 1 Ready for ${request.phaseId.toUpperCase()}!`,
            html: getReflectionReadyTemplate(request.student.name, request.phaseId.toUpperCase()),
            type: 'status_update'
          });
        }
        await progress.save();
      }
    }

    // Send email notification to student
    const emailSubject = approve
      ? `Sub-Phase Approved - ${request.subPhaseId}`
      : `Sub-Phase Rejected - ${request.subPhaseId}`;
    const emailHtml = getStatusUpdateTemplate(
      request.student.name,
      request.phaseId.toUpperCase(),
      request.subPhaseId,
      newStatus,
      approvalMessage
    );
    await sendEmail({
      to: request.student.email,
      subject: emailSubject,
      html: emailHtml,
      type: 'status_update'
    });

    // Log action
    await logAction(req.user._id, `subphase_${newStatus}`, req.ip, {
      studentEmail: request.student.email,
      phaseId: request.phaseId,
      subPhaseId: request.subPhaseId
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Student requests reflection approval
router.post('/reflection-request', protect, async (req, res) => {
  try {
    const { phaseId, submissionMessage, reflectionType = 'reflection1' } = req.body;
    if (!phaseId) return res.status(400).json({ message: 'Phase required' });
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit reflection requests' });
    }

    const requestType = reflectionType === 'final-reflection' ? 'final-reflection' : 'reflection1';
    const progress = await Progress.findOne({ user: req.user._id });
    const phaseProgress = progress?.phases.find(p => p.phaseId === phaseId);
    if (!phaseProgress) {
      return res.status(404).json({ message: 'Phase progress not found' });
    }

    const allSubPhasesCompleted = phaseProgress.subPhases?.length > 0
      && phaseProgress.subPhases.every(sp => sp.status === 'completed');
    if (!allSubPhasesCompleted) {
      return res.status(403).json({ message: 'Complete all sub-phases before submitting a reflection' });
    }

    if (requestType === 'reflection1') {
      if (phaseProgress.reflection1Status === 'pending') {
        return res.status(400).json({ message: 'Reflection 1 approval request already pending' });
      }
      if (phaseProgress.reflection1Status === 'approved') {
        return res.status(400).json({ message: 'Reflection 1 is already approved' });
      }
    }

    if (requestType === 'final-reflection') {
      if (phaseProgress.reflection1Status !== 'approved') {
        return res.status(403).json({ message: 'Reflection 1 must be approved before Final Reflection' });
      }
      if (phaseProgress.finalReflectionStatus === 'pending') {
        return res.status(400).json({ message: 'Final Reflection approval request already pending' });
      }
      if (phaseProgress.finalReflectionStatus === 'approved') {
        return res.status(400).json({ message: 'Final Reflection is already approved' });
      }
    }

    const exists = await ApprovalRequest.findOne({
      student: req.user._id,
      phaseId,
      type: requestType,
      status: 'pending'
    });

    if (exists) return res.status(400).json({ message: 'Reflection approval request already pending' });

    const request = await ApprovalRequest.create({
      student: req.user._id,
      phaseId,
      subPhaseId: requestType,
      type: requestType,
      submissionMessage: submissionMessage || '',
      status: 'pending'
    });

    await Reflection.create({
      student: req.user._id,
      phaseId,
      type: requestType,
      content: submissionMessage || '',
      approvalRequest: request._id,
      status: 'pending'
    });

    // Update progress reflection status
    if (progress) {
      if (phaseProgress) {
        if (requestType === 'reflection1') {
          phaseProgress.reflection1Status = 'pending';
          phaseProgress.reflectionStatus = 'ready-for-review';
        } else {
          phaseProgress.finalReflectionStatus = 'pending';
        }
        await progress.save();
      }
    }

    // Log action
    await logAction(req.user._id, `${requestType}_submitted`, req.ip, { phaseId });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mentor approves reflection and unlocks next phase
router.post('/reflection-request/:requestId/approve', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { approve, approvalMessage } = req.body;
    const request = await ApprovalRequest.findById(req.params.requestId)
      .populate('student', 'name email');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    const newStatus = approve ? 'approved' : 'rejected';
    request.status = newStatus;
    request.approvalMessage = approvalMessage || '';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    await request.save();

    await Reflection.updateMany(
      { approvalRequest: request._id },
      {
        status: newStatus,
        reviewedBy: req.user._id,
        reviewedAt: request.approvedAt,
        feedback: approvalMessage || '',
        updatedAt: new Date()
      }
    );

    // Reflection 1 unlocks Final Reflection. Final Reflection completes the phase.
    const progress = await Progress.findOne({ user: request.student._id });
    if (progress) {
      const phaseProgress = progress.phases.find(p => p.phaseId === request.phaseId);
      if (phaseProgress) {
        const isReflection1 = request.type === 'reflection1';
        const isFinalReflection = request.type === 'final-reflection' || request.type === 'reflection';

        if (isReflection1) {
          phaseProgress.reflection1Status = approve ? 'approved' : 'rejected';
          if (approve) {
            phaseProgress.finalReflectionStatus = 'ready';
          }
        }

        if (isFinalReflection && approve) {
          phaseProgress.status = 'completed';
          phaseProgress.reflectionStatus = 'approved';
          phaseProgress.finalReflectionStatus = 'approved';
          phaseProgress.completedAt = new Date();

          // Find current phase index and unlock next
          const currentIndex = progress.phases.findIndex(p => p.phaseId === request.phaseId);
          if (currentIndex !== -1 && currentIndex < progress.phases.length - 1) {
            const nextPhase = progress.phases[currentIndex + 1];
            nextPhase.status = 'unlocked';
            nextPhase.unlockedAt = new Date();
            progress.currentPhase = nextPhase.phaseId;
          }
        } else if (isFinalReflection) {
          phaseProgress.reflectionStatus = 'rejected';
          phaseProgress.finalReflectionStatus = 'rejected';
        }
        await progress.save();
      }
    }

    // Send email notification to student
    const reflectionLabel = request.type === 'reflection1' ? 'Reflection 1' : 'Final Reflection';
    const emailSubject = approve
      ? `${request.type === 'reflection1' ? 'Reflection 1 Approved' : 'Phase Completed'} - ${request.phaseId.toUpperCase()}`
      : `${reflectionLabel} Rejected - ${request.phaseId.toUpperCase()}`;
    const emailHtml = getStatusUpdateTemplate(
      request.student.name,
      request.phaseId.toUpperCase(),
      reflectionLabel,
      newStatus,
      approvalMessage
    );
    await sendEmail({
      to: request.student.email,
      subject: emailSubject,
      html: emailHtml,
      type: 'status_update'
    });

    // Log action
    await logAction(req.user._id, `${request.type}_${newStatus}`, req.ip, {
      studentEmail: request.student.email,
      phaseId: request.phaseId
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
