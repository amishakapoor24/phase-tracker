const express = require('express');
const House = require('../models/House');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const houses = await House.find({ isActive: true }).sort({ name: 1 });
    res.json(houses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
