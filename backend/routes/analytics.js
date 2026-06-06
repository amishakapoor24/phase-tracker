const express = require('express');
const { protect, mentorOrAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Progress = require('../models/Progress');
const ApprovalRequest = require('../models/ApprovalRequest');
const House = require('../models/House');
const Phase = require('../models/Phase');

const router = express.Router();

router.get('/summary', protect, mentorOrAdmin, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('name email house status');
    const mentors = await User.find({ role: 'mentor' }).select('name email');
    const allProgress = await Progress.find().populate('user', 'name house status');
    const allRequests = await ApprovalRequest.find().populate('approvedBy', 'name email');

    // 1. House Performance
    const activeHouses = await House.find({ isActive: true }).sort({ name: 1 });
    const houseMap = {};
    activeHouses.forEach(h => {
      houseMap[h.slug] = {
        house: h.slug,
        name: h.name,
        color: h.color,
        studentCount: 0,
        avgScore: 0,
        totalScoreSum: 0,
        totalCompletedPhases: 0
      };
    });

    students.forEach(student => {
      if (student.house && houseMap[student.house]) {
        houseMap[student.house].studentCount += 1;
      }
    });

    allProgress.forEach(prog => {
      if (prog.user && prog.user.house && houseMap[prog.user.house]) {
        const hData = houseMap[prog.user.house];
        hData.totalScoreSum += prog.totalScore || 0;
        
        const completedPhases = prog.phases ? prog.phases.filter(p => p.status === 'completed').length : 0;
        hData.totalCompletedPhases += completedPhases;
      }
    });

    const housesData = Object.values(houseMap).map(h => {
      return {
        house: h.house,
        name: h.name,
        color: h.color,
        studentCount: h.studentCount,
        avgScore: h.studentCount > 0 ? Math.round(h.totalScoreSum / h.studentCount) : 0,
        totalCompletedPhases: h.totalCompletedPhases
      };
    });

    // 2. Student Phase Distribution
    const phasesList = await Phase.find().sort({ order: 1 }).select('id name');
    const phaseDistribution = {};
    phasesList.forEach(ph => {
      phaseDistribution[ph.id] = { phaseName: ph.name, locked: 0, unlocked: 0, completed: 0, total: 0 };
    });

    allProgress.forEach(prog => {
      if (prog.phases) {
        prog.phases.forEach(p => {
          if (phaseDistribution[p.phaseId]) {
            phaseDistribution[p.phaseId][p.status] = (phaseDistribution[p.phaseId][p.status] || 0) + 1;
            phaseDistribution[p.phaseId].total += 1;
          }
        });
      }
    });

    const distData = Object.keys(phaseDistribution).map(key => ({
      phaseId: key,
      ...phaseDistribution[key]
    }));

    // 3. Mentor Activity
    const mentorMap = {};
    mentors.forEach(m => {
      mentorMap[m._id.toString()] = { name: m.name, email: m.email, totalReviews: 0, approvals: 0, rejections: 0 };
    });

    allRequests.forEach(reqObj => {
      if (reqObj.approvedBy) {
        const mIdStr = reqObj.approvedBy._id.toString();
        if (!mentorMap[mIdStr]) {
          mentorMap[mIdStr] = {
            name: reqObj.approvedBy.name,
            email: reqObj.approvedBy.email,
            totalReviews: 0,
            approvals: 0,
            rejections: 0
          };
        }
        
        mentorMap[mIdStr].totalReviews += 1;
        if (reqObj.status === 'approved') {
          mentorMap[mIdStr].approvals += 1;
        } else if (reqObj.status === 'rejected') {
          mentorMap[mIdStr].rejections += 1;
        }
      }
    });

    const mentorStats = Object.values(mentorMap);

    // 4. Overalls
    const totalStudents = students.length;
    const totalMentors = mentors.length;
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
    const approvedRequests = allRequests.filter(r => r.status === 'approved').length;
    const rejectedRequests = allRequests.filter(r => r.status === 'rejected').length;

    res.json({
      houses: housesData,
      phaseDistribution: distData,
      mentorActivity: mentorStats,
      summary: {
        totalStudents,
        totalMentors,
        totalRequests,
        pendingRequests,
        approvedRequests,
        rejectedRequests
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
