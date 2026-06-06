const User = require('../models/User');
const Progress = require('../models/Progress');
const ApprovalRequest = require('../models/ApprovalRequest');
const Phase = require('../models/Phase');
const House = require('../models/House');

/**
 * Get overall statistics
 */
const getOverallStats = async () => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    const pendingApprovals = await ApprovalRequest.countDocuments({ status: 'pending' });
    const approvedRequests = await ApprovalRequest.countDocuments({ status: 'approved' });
    const rejectedRequests = await ApprovalRequest.countDocuments({ status: 'rejected' });

    return {
      totalUsers,
      totalStudents,
      totalMentors,
      totalAdmins,
      pendingApprovals,
      approvedRequests,
      rejectedRequests,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get house-wise statistics
 */
const getHouseStats = async () => {
  try {
    const houses = await House.find({ isActive: true }).lean();
    const stats = {};

    for (const house of houses) {
      const students = await User.countDocuments({ house: house.slug, role: 'student' });
      const studentIds = await User.find({ house: house.slug, role: 'student' }).select('_id');
      const approvals = await ApprovalRequest.countDocuments({
        student: { $in: studentIds },
      });

      stats[house.slug] = {
        name: house.name,
        totalStudents: students,
        totalApprovals: approvals,
      };
    }

    return stats;
  } catch (error) {
    throw error;
  }
};

/**
 * Get phase completion statistics
 */
const getPhaseStats = async () => {
  try {
    const phases = await Phase.find().lean();
    const stats = [];

    for (const phase of phases) {
      const totalCompletions = await Progress.countDocuments({
        'phases.phaseId': phase.id,
        'phases.status': 'completed',
      });

      const inProgress = await Progress.countDocuments({
        'phases.phaseId': phase.id,
        'phases.status': { $in: ['unlocked', 'in_progress'] },
      });

      const pending = await Progress.countDocuments({
        'phases.phaseId': phase.id,
        'phases.status': 'locked',
      });

      stats.push({
        phaseId: phase.id,
        phaseName: phase.name,
        completed: totalCompletions,
        inProgress,
        pending,
      });
    }

    return stats;
  } catch (error) {
    throw error;
  }
};

/**
 * Get student progress distribution
 */
const getStudentProgressDistribution = async () => {
  try {
    const students = await User.find({ role: 'student' }).lean();
    const distribution = {
      notStarted: 0,
      inProgress: 0,
      completed: 0,
    };

    for (const student of students) {
      const progress = await Progress.findOne({ user: student._id }).lean();

      if (!progress || !progress.phases || progress.phases.length === 0) {
        distribution.notStarted++;
      } else {
        const completedPhases = progress.phases.filter(
          (p) => p.status === 'completed'
        ).length;
        const totalPhases = progress.phases.length;

        if (completedPhases === 0) {
          distribution.inProgress++;
        } else if (completedPhases === totalPhases) {
          distribution.completed++;
        } else {
          distribution.inProgress++;
        }
      }
    }

    return distribution;
  } catch (error) {
    throw error;
  }
};

/**
 * Get mentor activity statistics
 */
const getMentorStats = async () => {
  try {
    const mentors = await User.find({ role: 'mentor' }).lean();
    const stats = [];

    for (const mentor of mentors) {
      const approvals = await ApprovalRequest.countDocuments({
        approvedBy: mentor._id,
        status: 'approved',
      });

      const rejections = await ApprovalRequest.countDocuments({
        approvedBy: mentor._id,
        status: 'rejected',
      });

      const pendingReviews = await ApprovalRequest.countDocuments({
        status: 'pending',
      });

      stats.push({
        mentorId: mentor._id,
        mentorName: mentor.name,
        approvals,
        rejections,
        pendingReviews,
        totalActions: approvals + rejections,
      });
    }

    return stats;
  } catch (error) {
    throw error;
  }
};

/**
 * Get approval timeline data (last 30 days)
 */
const getApprovalTimeline = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timeline = await ApprovalRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          approved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    return timeline;
  } catch (error) {
    throw error;
  }
};

/**
 * Get student performance by phase
 */
const getStudentPhasePerformance = async (studentId) => {
  try {
    const progress = await Progress.findOne({ user: studentId })
      .populate('user', 'name email house')
      .lean();

    if (!progress) {
      return null;
    }

    const performance = {
      studentName: progress.user.name,
      house: progress.user.house,
      phases: [],
    };

      if (progress.phases) {
      for (const phase of progress.phases) {
        const phaseData = await Phase.findOne({ id: phase.phaseId }).lean();

        performance.phases.push({
          phaseId: phase.phaseId,
          phaseName: phaseData?.name || 'Unknown',
          status: phase.status,
          completedSubPhases:
            phase.subPhases?.filter((sp) => sp.status === 'completed').length || 0,
          totalSubPhases: phase.subPhases?.length || 0,
          reflectionStatus: phase.reflectionStatus,
          completedAt: phase.completedAt,
        });
      }
    }

    return performance;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getOverallStats,
  getHouseStats,
  getPhaseStats,
  getStudentProgressDistribution,
  getMentorStats,
  getApprovalTimeline,
  getStudentPhasePerformance,
};
