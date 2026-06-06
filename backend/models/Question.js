const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  phaseId: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true, validate: { validator: (v) => v.length === 4 } },
  answer: { type: Number, required: true, min: 0, max: 3 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
