const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Phase = require('../models/Phase');
const SubPhase = require('../models/SubPhase');
const Submission = require('../models/Submission');
const House = require('../models/House');
const { protect } = require('../middleware/auth');
const { logAction } = require('../services/auditService');
const { sendEmail, getWelcomeTemplate, getForgotPasswordTemplate } = require('../services/emailService');

const router = express.Router();

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

const initProgress = async (userId) => {
  // Fetch all phases from database sorted by order
  const allPhases = await Phase.find().sort({ order: 1 });
  
  if (allPhases.length === 0) {
    // If no phases exist, create empty progress
    await Progress.create({ user: userId, currentPhase: null, phases: [] });
    return;
  }

  // Find the starting phase
  const startingPhase = allPhases.find(p => p.isStarting) || allPhases[0];

  // Fetch subphases for the starting phase to initialize them
  const SubPhase = require('../models/SubPhase');
  const startingSubPhases = await SubPhase.find({ phaseId: startingPhase.id }).sort({ order: 1 });
  const initializedSubPhases = startingSubPhases.map((sp, index) => ({
    subPhaseId: sp.id,
    status: index === 0 ? 'unlocked' : 'locked',
    approvalRequested: false,
    approvalStatus: null
  }));

  // Initialize phases array with starting phase unlocked and others locked
  const phases = allPhases.map((phase) => ({
    phaseId: phase.id,
    status: phase.id === startingPhase.id ? 'unlocked' : 'locked',
    subPhases: phase.id === startingPhase.id ? initializedSubPhases : [],
    attempts: [],
    bestScore: 0
  }));

  await Progress.create({ 
    user: userId, 
    currentPhase: startingPhase.id, 
    phases 
  });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, house } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    
    // Security: Public registration always forces the role to 'student'
    const finalRole = 'student';
    
    let selectedHouse = null;
    if (!house) return res.status(400).json({ message: 'House is required for students' });

    const requestedHouse = house.toLowerCase().trim();
    const activeHouse = await House.findOne({ slug: requestedHouse, isActive: true });

    if (!activeHouse) {
      return res.status(400).json({ message: 'Please select a valid active house' });
    }

    selectedHouse = activeHouse.slug;
    
    const user = await User.create({ 
      name, 
      email, 
      password,
      role: finalRole,
      house: selectedHouse
    });
    
    await initProgress(user._id);

    // Audit Log
    await logAction(user._id, 'user_registered', req.ip, { email: user.email, role: user.role });

    // Send Welcome Email
    await sendEmail({
      to: user.email,
      subject: 'Welcome to PhaseTracker! 🎉',
      html: getWelcomeTemplate(user.name),
      type: 'welcome'
    });

    res.status(201).json({
      _id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      house: user.house,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account has been disabled. Please contact an admin.' });
    }

    // Audit Log
    await logAction(user._id, 'user_logged_in', req.ip);

    res.json({
      _id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      house: user.house,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ 
    _id: req.user._id, 
    name: req.user.name, 
    email: req.user.email,
    role: req.user.role,
    house: req.user.house,
    avatar: req.user.avatar
  });
});

router.put('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.avatar) user.avatar = req.body.avatar;
    if (req.body.password) user.password = req.body.password;

    await user.save();

    res.json({
      _id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      house: user.house,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile by ID (with permissions)
router.get('/profile/:id', protect, async (req, res) => {
  try {
    const targetId = req.params.id === 'me' ? req.user._id : req.params.id;
    
    // Permission Check
    if (req.user.role === 'student' && targetId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Students can only view their own profile' });
    }

    const targetUser = await User.findById(targetId).select('-password');
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    // Mentors can only view mentors and students (not admins, unless they are viewing themselves)
    if (req.user.role === 'mentor' && targetUser.role === 'admin' && targetId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Mentors cannot view admin profiles' });
    }

    let progress = null;
    let submissions = [];
    let phaseMappings = {};

    if (targetUser.role === 'student') {
      progress = await Progress.findOne({ user: targetId });
      submissions = await Submission.find({ student: targetId }).sort({ updatedAt: -1 });

      const allPhases = await Phase.find();
      const allSubPhases = await SubPhase.find();
      
      allPhases.forEach(p => {
        phaseMappings[p.id] = { title: p.title, subPhases: {} };
      });
      allSubPhases.forEach(sp => {
        if (phaseMappings[sp.phaseId]) {
          phaseMappings[sp.phaseId].subPhases[sp.id] = sp.title;
        }
      });
    }

    res.json({
      user: targetUser,
      progress,
      submissions,
      phaseMappings
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/forgotpassword', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: getForgotPasswordTemplate(resetUrl),
        type: 'password_reset'
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/resetpassword/:resettoken', async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      _id: user._id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
