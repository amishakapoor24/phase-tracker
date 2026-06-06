const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  score: Number,
  total: Number,
  percentage: Number,
  passed: Boolean,
  attemptedAt: { type: Date, default: Date.now }
});

const phaseProgressSchema = new mongoose.Schema({
  phaseId: { type: String, required: true },
  status: { type: String, enum: ['locked', 'unlocked', 'reflection-ready', 'completed'], default: 'locked' },
  subPhases: [{
    subPhaseId: { type: String, required: true },
    status: { type: String, enum: ['locked', 'unlocked', 'completed'], default: 'locked' },
    approvalRequested: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: null },
    completedAt: { type: Date, default: null }
  }],
  reflectionStatus: { type: String, enum: ['not-ready', 'ready-for-review', 'approved', 'rejected'], default: 'not-ready' },
  reflection1Status: { type: String, enum: ['not-ready', 'ready', 'pending', 'approved', 'rejected'], default: 'not-ready' },
  finalReflectionStatus: { type: String, enum: ['not-ready', 'ready', 'pending', 'approved', 'rejected'], default: 'not-ready' },
  attempts: [attemptSchema],
  bestScore: { type: Number, default: 0 },
  unlockedAt: Date,
  completedAt: Date
});

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentPhase: { type: String, default: 'html' },
  phases: [phaseProgressSchema],
  totalScore: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Progress', progressSchema);
