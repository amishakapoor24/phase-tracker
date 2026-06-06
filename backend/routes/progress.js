const express = require('express');
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');

const router = express.Router();
const PHASE_ORDER = ['html', 'css', 'javascript', 'dom', 'react', 'backend'];

router.get('/', protect, async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      const phases = PHASE_ORDER.map((id, i) => ({
        phaseId: id, status: i === 0 ? 'unlocked' : 'locked', attempts: [], bestScore: 0
      }));
      progress = await Progress.create({ user: req.user._id, currentPhase: 'html', phases });
    }
    res.json(progress);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/my-progress', protect, async (req, res) => {
  try {
    let progress = await Progress.findOne({ user: req.user._id });
    if (!progress) {
      const phases = PHASE_ORDER.map((id, i) => ({
        phaseId: id, status: i === 0 ? 'unlocked' : 'locked', attempts: [], bestScore: 0, subPhases: []
      }));
      progress = await Progress.create({ user: req.user._id, currentPhase: 'html', phases });
    }
    res.json(progress);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/submit', protect, async (req, res) => {
  try {
    const { phaseId, score, total } = req.body;
    const percentage = Math.round((score / total) * 100);
    const passed = percentage >= 70;

    let progress = await Progress.findOne({ user: req.user._id });
    const phaseIndex = progress.phases.findIndex(p => p.phaseId === phaseId);
    if (phaseIndex === -1) return res.status(404).json({ message: 'Phase not found' });

    const phase = progress.phases[phaseIndex];
    phase.attempts.push({ score, total, percentage, passed });
    if (percentage > phase.bestScore) phase.bestScore = percentage;

    if (passed && phase.status !== 'completed') {
      phase.status = 'completed';
      phase.completedAt = new Date();
      const nextIndex = PHASE_ORDER.indexOf(phaseId) + 1;
      if (nextIndex < PHASE_ORDER.length) {
        const nextPhase = progress.phases.find(p => p.phaseId === PHASE_ORDER[nextIndex]);
        if (nextPhase && nextPhase.status === 'locked') {
          nextPhase.status = 'unlocked';
          nextPhase.unlockedAt = new Date();
        }
        progress.currentPhase = PHASE_ORDER[nextIndex];
      }
    }

    // Recalculate totalScore
    progress.totalScore = progress.phases.reduce((sum, p) => sum + (p.bestScore || 0), 0);

    progress.updatedAt = new Date();
    await progress.save();
    res.json({ passed, percentage, progress });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
