const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#000' },
  bg: { type: String, default: '#f0f0f0' },
  order: { type: Number, required: true },
  isStarting: { type: Boolean, default: false },
  isEnding: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Phase', phaseSchema);
