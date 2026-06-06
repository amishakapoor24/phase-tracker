const express = require('express');
const Announcement = require('../models/Announcement');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const query = {
      isPublished: true,
      $or: [
        { audience: 'all' },
        { audience: `${req.user.role}s` }
      ]
    };

    if (req.user.role === 'student' && req.user.house) {
      query.$or.push({ audience: 'house', house: req.user.house });
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
