const express = require('express');
const router = express.Router();
const Phase = require('../models/Phase');

// Get all phases (public - visible to all users)
router.get('/', async (req, res) => {
  try {
    const phases = await Phase.find()
      .populate('createdBy', 'name email')
      .sort({ order: 1 });
    res.json(phases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single phase
router.get('/:id', async (req, res) => {
  try {
    const phase = await Phase.findOne({ id: req.params.id })
      .populate('createdBy', 'name email');
    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    res.json(phase);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
