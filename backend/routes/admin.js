const express = require('express');
const { protect, adminOnly, mentorOrAdmin } = require('../middleware/auth');
const Phase = require('../models/Phase');
const Question = require('../models/Question');
const Progress = require('../models/Progress');
const User = require('../models/User');
const House = require('../models/House');
const Announcement = require('../models/Announcement');
const { logAction } = require('../services/auditService');

const router = express.Router();

// ===== HOUSE ROUTES =====

router.get('/houses', protect, mentorOrAdmin, async (req, res) => {
  try {
    const houses = await House.find().populate('createdBy', 'name email').sort({ name: 1 });
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/houses', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, color, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'House name is required' });

    const finalSlug = (slug || name).toLowerCase().trim().replace(/\s+/g, '-');
    const exists = await House.findOne({ $or: [{ name }, { slug: finalSlug }] });
    if (exists) return res.status(400).json({ message: 'House already exists' });

    const house = await House.create({
      name,
      slug: finalSlug,
      description: description || '',
      color: color || '#2563eb',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    await logAction(req.user._id, 'house_created', req.ip, { house: house.name });
    res.status(201).json(house);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/houses/:houseId', protect, adminOnly, async (req, res) => {
  try {
    const { name, slug, description, color, isActive } = req.body;
    const update = {
      name,
      slug: slug ? slug.toLowerCase().trim().replace(/\s+/g, '-') : undefined,
      description,
      color,
      isActive,
      updatedAt: new Date()
    };
    Object.keys(update).forEach((key) => update[key] === undefined && delete update[key]);

    const house = await House.findByIdAndUpdate(req.params.houseId, update, { new: true })
      .populate('createdBy', 'name email');
    if (!house) return res.status(404).json({ message: 'House not found' });

    await logAction(req.user._id, 'house_updated', req.ip, { house: house.name });
    res.json(house);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/houses/:houseId', protect, adminOnly, async (req, res) => {
  try {
    const house = await House.findById(req.params.houseId);
    if (!house) return res.status(404).json({ message: 'House not found' });

    const assignedStudents = await User.countDocuments({ role: 'student', house: house.slug });
    if (assignedStudents > 0) {
      return res.status(400).json({ message: 'Cannot delete a house with assigned students' });
    }

    await house.deleteOne();
    await logAction(req.user._id, 'house_deleted', req.ip, { house: house.name });
    res.json({ message: 'House deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== ANNOUNCEMENT ROUTES =====

router.get('/announcements', protect, mentorOrAdmin, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/announcements', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { title, body, audience, house, isPublished } = req.body;
    if (!title || !body) return res.status(400).json({ message: 'Title and body are required' });

    const announcement = await Announcement.create({
      title,
      body,
      audience: audience || 'all',
      house: audience === 'house' ? house : null,
      isPublished: isPublished !== undefined ? isPublished : true,
      createdBy: req.user._id
    });

    await logAction(req.user._id, 'announcement_created', req.ip, { announcement: announcement.title });
    res.status(201).json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/announcements/:announcementId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { title, body, audience, house, isPublished } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.announcementId,
      {
        title,
        body,
        audience,
        house: audience === 'house' ? house : null,
        isPublished,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });
    await logAction(req.user._id, 'announcement_updated', req.ip, { announcement: announcement.title });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/announcements/:announcementId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.announcementId);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

    await logAction(req.user._id, 'announcement_deleted', req.ip, { announcement: announcement.title });
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== PHASE ROUTES =====

// Get all phases
router.get('/phases', protect, mentorOrAdmin, async (req, res) => {
  try {
    const phases = await Phase.find().populate('createdBy', 'name email').sort({ order: 1 });
    res.json(phases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single phase
router.get('/phases/:id', protect, mentorOrAdmin, async (req, res) => {
  try {
    const phase = await Phase.findOne({ id: req.params.id }).populate('createdBy', 'name email');
    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    res.json(phase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create phase
router.post('/phases', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { id, name, description, icon, color, bg, order, isStarting, isEnding } = req.body;
    if (!id || !name || !description || order === undefined)
      return res.status(400).json({ message: 'All required fields must be provided' });

    const exists = await Phase.findOne({ id });
    if (exists) return res.status(400).json({ message: 'Phase ID already exists' });

    // If setting as starting, remove isStarting from other phases
    if (isStarting) {
      await Phase.updateMany({ isStarting: true }, { isStarting: false });
    }

    // If setting as ending, remove isEnding from other phases
    if (isEnding) {
      await Phase.updateMany({ isEnding: true }, { isEnding: false });
    }

    const phase = await Phase.create({
      id: id.toLowerCase(),
      name,
      description,
      icon: icon || '📚',
      color: color || '#000',
      bg: bg || '#f0f0f0',
      order,
      isStarting: isStarting || false,
      isEnding: isEnding || false,
      createdBy: req.user._id
    });

    const phaseProgress = {
      phaseId: phase.id,
      status: isStarting ? 'unlocked' : 'locked',
      attempts: [],
      bestScore: 0,
      subPhases: []
    };

    const allProgress = await Progress.find();
    for (const progress of allProgress) {
      const alreadyExists = progress.phases.some(p => p.phaseId === phase.id);
      if (!alreadyExists) {
        const shouldUnlock = isStarting || progress.phases.length === 0 || !progress.currentPhase;
        progress.phases.push({ ...phaseProgress, status: shouldUnlock ? 'unlocked' : 'locked' });
        if (shouldUnlock) {
          progress.currentPhase = phase.id;
        }
        progress.updatedAt = new Date();
        await progress.save();
      }
    }

    await logAction(req.user._id, 'phase_created', req.ip, { phase: phase.id });
    res.status(201).json(phase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update phase
router.put('/phases/:id', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { name, description, icon, color, bg, order, isStarting, isEnding } = req.body;
    
    // If setting as starting, remove isStarting from other phases
    if (isStarting) {
      await Phase.updateMany({ id: { $ne: req.params.id }, isStarting: true }, { isStarting: false });
    }

    // If setting as ending, remove isEnding from other phases
    if (isEnding) {
      await Phase.updateMany({ id: { $ne: req.params.id }, isEnding: true }, { isEnding: false });
    }

    const phase = await Phase.findOneAndUpdate(
      { id: req.params.id },
      { name, description, icon, color, bg, order, isStarting, isEnding, updatedAt: new Date() },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    
    await logAction(req.user._id, 'phase_updated', req.ip, { phase: phase.id });
    res.json(phase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete phase
router.delete('/phases/:id', protect, mentorOrAdmin, async (req, res) => {
  try {
    const phase = await Phase.findOneAndDelete({ id: req.params.id });
    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    
    // Delete all questions for this phase
    await Question.deleteMany({ phaseId: req.params.id });
    const allProgress = await Progress.find();
    for (const progress of allProgress) {
      progress.phases = progress.phases.filter(p => p.phaseId !== req.params.id);
      if (progress.currentPhase === req.params.id) {
        const nextAvailable = progress.phases.find(p => p.status === 'unlocked') || progress.phases[0];
        progress.currentPhase = nextAvailable?.phaseId || null;
      }
      progress.updatedAt = new Date();
      await progress.save();
    }
    
    await logAction(req.user._id, 'phase_deleted', req.ip, { phase: req.params.id });
    res.json({ message: 'Phase deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== QUESTION ROUTES =====

// Get questions for a phase
router.get('/questions/:phaseId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const questions = await Question.find({ phaseId: req.params.phaseId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single question
router.get('/question/:questionId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId).populate('createdBy', 'name email');
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json(question);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create question
router.post('/questions', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { phaseId, question, options, answer } = req.body;

    if (!phaseId || !question || !options || answer === undefined)
      return res.status(400).json({ message: 'All fields required' });

    if (options.length !== 4)
      return res.status(400).json({ message: 'Exactly 4 options required' });

    if (answer < 0 || answer > 3)
      return res.status(400).json({ message: 'Answer must be between 0 and 3' });

    const phase = await Phase.findOne({ id: phaseId });
    if (!phase) return res.status(404).json({ message: 'Phase not found' });

    const newQuestion = await Question.create({
      phaseId,
      question,
      options,
      answer,
      createdBy: req.user._id
    });

    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update question
router.put('/question/:questionId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { question, options, answer } = req.body;

    if (options && options.length !== 4)
      return res.status(400).json({ message: 'Exactly 4 options required' });

    if (answer !== undefined && (answer < 0 || answer > 3))
      return res.status(400).json({ message: 'Answer must be between 0 and 3' });

    const updated = await Question.findByIdAndUpdate(
      req.params.questionId,
      { question, options, answer },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!updated) return res.status(404).json({ message: 'Question not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete question
router.delete('/question/:questionId', protect, mentorOrAdmin, async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    res.json({ message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ===== STUDENT PROGRESS ROUTES =====

// Get all student progress
router.get('/student-progress', protect, mentorOrAdmin, async (req, res) => {
  try {
    const allProgress = await Progress.find()
      .populate('user', 'name email house')
      .sort({ updatedAt: -1 });

    const studentData = allProgress.map(p => ({
      _id: p.user._id,
      name: p.user.name,
      email: p.user.email,
      progressData: p
    }));

    res.json(studentData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users with filters
router.get('/users', protect, mentorOrAdmin, async (req, res) => {
  try {
    const { search, role, house } = req.query;
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role && role !== 'all') {
      query.role = role;
    }
    if (house && house !== 'all') {
      query.house = house;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create mentor/admin/student user explicitly
router.post('/users', protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role, house } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    if (!['mentor', 'admin', 'student'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    let selectedHouse = null;
    if (role === 'student') {
      if (!house) return res.status(400).json({ message: 'House is required for students' });

      const activeHouse = await House.findOne({ slug: house.toLowerCase().trim(), isActive: true });
      if (!activeHouse) {
        return res.status(400).json({ message: 'Please select a valid active house' });
      }

      selectedHouse = activeHouse.slug;
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      house: selectedHouse
    });

    const { logAction } = require('../services/auditService');
    await logAction(req.user._id, 'user_created', req.ip, { createdUser: user.email, role: user.role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      house: user.house,
      status: user.status
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Toggle user status active/disabled
router.put('/users/:userId/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own status' });
    }

    user.status = status;
    await user.save();

    const { logAction } = require('../services/auditService');
    await logAction(req.user._id, 'user_status_changed', req.ip, { updatedUser: user.email, status: user.status });

    res.json({ message: `User status changed to ${status}`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Audit Logs
router.get('/audit-logs', protect, adminOnly, async (req, res) => {
  try {
    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
