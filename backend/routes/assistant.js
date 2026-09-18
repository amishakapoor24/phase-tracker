const express = require('express');
const { protect, requireRouteAccess } = require('../middleware/auth');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Phase = require('../models/Phase');
const SubPhase = require('../models/SubPhase');
const ApprovalRequest = require('../models/ApprovalRequest');
const House = require('../models/House');

const router = express.Router();

const getRoleContext = async (user) => {
  const base = {
    role: user.role,
    name: user.name,
    email: user.email,
    hasAccessTo: {
      ownProfile: true,
      dashboard: true,
      notifications: true,
      assistant: true
    }
  };

  if (user.role === 'student') {
    const profile = await User.findById(user._id).select('name email house role');
    const progress = await Progress.findOne({ user: user._id }).lean();
    const phases = await Phase.find().sort({ order: 1 }).lean();
    const subPhases = await SubPhase.find().lean();
    const pendingApprovals = await ApprovalRequest.find({ student: user._id, status: 'pending' }).lean();

    return {
      ...base,
      house: profile?.house || null,
      stats: {
        totalPhases: phases.length,
        progressCount: progress?.phases?.length || 0,
        pendingApprovals: pendingApprovals.length,
        completedPhases: progress?.phases?.filter(p => p.status === 'completed').length || 0
      },
      context: {
        personal: {
          profile,
          progress,
          phases,
          subPhases,
          pendingApprovals
        }
      },
      hasAccessTo: {
        ownProfile: true,
        dashboard: true,
        phaseProgress: true,
        notifications: true,
        assistant: true,
        houseInsights: !!profile?.house,
        mentorData: false,
        adminData: false
      }
    };
  }

  if (user.role === 'mentor') {
    const students = await User.find({ role: 'student' }).select('name email house status').lean();
    const pendingApprovals = await ApprovalRequest.find({ status: 'pending' }).populate('student', 'name email house').lean();
    const houses = await House.find({ isActive: true }).lean();

    return {
      ...base,
      stats: {
        studentCount: students.length,
        pendingApprovals: pendingApprovals.length,
        activeHouseCount: houses.length
      },
      context: {
        team: {
          students,
          pendingApprovals,
          houses
        }
      },
      hasAccessTo: {
        ownProfile: true,
        dashboard: true,
        studentProgress: true,
        approvals: true,
        analytics: true,
        phaseManagement: true,
        announcements: true,
        notifications: true,
        assistant: true,
        adminData: false
      }
    };
  }

  const students = await User.find({ role: 'student' }).select('name email house status').lean();
  const mentors = await User.find({ role: 'mentor' }).select('name email status').lean();
  const houses = await House.find().lean();
  const auditLogs = await require('../models/AuditLog').find().populate('user', 'name email role').sort({ createdAt: -1 }).limit(20).lean();

  return {
    ...base,
    stats: {
      studentCount: students.length,
      mentorCount: mentors.length,
      houseCount: houses.length,
      recentAuditEvents: auditLogs.length
    },
    context: {
      admin: {
        students,
        mentors,
        houses,
        auditLogs
      }
    },
    hasAccessTo: {
      ownProfile: true,
      dashboard: true,
      studentProgress: true,
      approvals: true,
      analytics: true,
      phaseManagement: true,
      announcements: true,
      notifications: true,
      houses: true,
      auditLogs: true,
      assistant: true,
      adminData: true
    }
  };
};

const buildAssistantReply = (user, context) => {
  const roleSummary = {
    student: 'You can ask about your own progress, upcoming tasks, reflections, and current phase status.',
    mentor: 'You can review your mentored students, pending approvals, and progress trends within your assigned scope.',
    admin: 'You can review system-wide operations, houses, users, audit trails, and performance data across the platform.'
  };

  const extras = {
    student: [
      'Your current phase and completion status',
      'Which sub-phases are unlocked or awaiting review',
      'Your recent submission and reflection progress',
      'What to do next to complete the current milestone'
    ],
    mentor: [
      'Student progress and pending approval queues',
      'House-level performance patterns',
      'Current blockers and approval follow-ups',
      'How to guide students toward the next milestone'
    ],
    admin: [
      'System access, role activity, and audit log status',
      'House and user-level platform health',
      'Operational trends across mentors and students',
      'Security and governance questions tied to platform usage'
    ]
  };

  return {
    role: user.role,
    summary: roleSummary[user.role] || roleSummary.student,
    dataScope: context.hasAccessTo,
    supportedQuestions: extras[user.role] || extras.student,
    instructions: [
      'Answer only using the data this user can access.',
      'Keep responses role-scoped and privacy-safe.',
      'When a request exceeds the user scope, explain the access limits clearly.'
    ]
  };
};

router.use(protect);
router.use((req, res, next) => requireRouteAccess('assistant')(req, res, next));

router.get('/context', async (req, res) => {
  try {
    const context = await getRoleContext(req.user);
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        role: req.user.role,
        email: req.user.email,
        house: req.user.house
      },
      assistant: buildAssistantReply(req.user, context),
      context
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { text, conversation = [] } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const assistantUrl = process.env.STS_ASSISTANT_URL || 'http://localhost:8001';
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Number(process.env.STS_ASSISTANT_TIMEOUT_MS || 30000));
      const assistantResponse = await fetch(`${assistantUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          text: String(text).trim(),
          conversation: Array.isArray(conversation) ? conversation.slice(-12) : [],
          user: {
            _id: req.user._id,
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            house: req.user.house
          }
        })
      });
      clearTimeout(timeout);
      const assistantData = await assistantResponse.json();
      if (assistantResponse.ok && assistantData.success && assistantData.response) {
        return res.json({
          response: assistantData.response,
          role: req.user.role,
          source: 'sts-assistant'
        });
      }
      const upstreamMessage = assistantData.detail || assistantData.message || assistantResponse.statusText;
      console.error('STS assistant response error:', upstreamMessage);
      return res.status(502).json({ message: 'Assistant service could not answer this request.' });
    } catch (assistantError) {
      console.error('STS assistant unavailable:', assistantError.message);
      return res.status(502).json({ message: 'Assistant service is temporarily unavailable.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
