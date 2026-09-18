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
      const assistantResponse = await fetch(`${assistantUrl}/api/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const assistantData = await assistantResponse.json();
      if (assistantResponse.ok && assistantData.success && assistantData.response) {
        return res.json({
          response: assistantData.response,
          role: req.user.role,
          source: 'sts-assistant'
        });
      }
      console.error('STS assistant response error:', assistantData.detail || assistantData.message || assistantResponse.statusText);
    } catch (assistantError) {
      console.error('STS assistant unavailable:', assistantError.message);
    }

    const context = await getRoleContext(req.user);
    const scopeSummary = buildAssistantReply(req.user, context);
    const cleanText = String(text).trim();
    const lower = cleanText.toLowerCase();

    const lowerPieces = [
      'progress', 'phase', 'subphase', 'reflection', 'approval', 'student', 'mentor', 'house', 'report', 'analytics', 'audit', 'admin', 'status'
    ];

    const relevant = lowerPieces.filter(item => lower.includes(item));
    let response = `I’m your ${req.user.role} assistant and I can help with ${scopeSummary.supportedQuestions.join(', ')}.`;

    if (req.user.role === 'student') {
      const profile = context.context.personal.profile;
      const progress = context.context.personal.progress;
      const phases = context.context.personal.phases || [];
      const pending = context.context.personal.pendingApprovals || [];

      response = `Hello ${profile?.name || 'student'}, your current access is limited to your own learning data. You have ${progress?.phases?.filter(p => p.status === 'completed').length || 0} completed phase(s), ${pending.length} pending approval(s), and ${phases.length} tracked phase(s).`;

      if (lower.includes('phase') || lower.includes('progress')) {
        response += ' I can explain your current phase status, unlocked work, and the next milestone to complete.';
      }
      if (lower.includes('approval') || lower.includes('reflection')) {
        response += ' I can summarize the review status of your submissions and reflections in your personal scope.';
      }
    }

    if (req.user.role === 'mentor') {
      const pending = context.context.team.pendingApprovals || [];
      const students = context.context.team.students || [];
      response = `You have access to mentor workspace data for ${students.length} student(s) and ${pending.length} pending approval(s).`;
      if (lower.includes('student') || lower.includes('progress')) {
        response += ' I can review student status, progress trends, and outstanding approvals that are in your mentoring scope.';
      }
      if (lower.includes('house')) {
        response += ' I can also summarize area-level insight for active houses under your visibility.';
      }
    }

    if (req.user.role === 'admin') {
      const students = context.context.admin.students || [];
      const mentors = context.context.admin.mentors || [];
      const houses = context.context.admin.houses || [];
      response = `As admin, you can access platform-wide information for ${students.length} student(s), ${mentors.length} mentor(s), and ${houses.length} house(s).`;
      if (lower.includes('audit') || lower.includes('logs')) {
        response += ' I can reference the recent audit activity and system events in admin scope.';
      }
    }

    if (relevant.length === 0) {
      response = `I can help with your ${req.user.role} data area: ${scopeSummary.supportedQuestions.join(', ')}.`;
    }

    res.json({
      response,
      role: req.user.role,
      scope: scopeSummary,
      dataSummary: context.stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
