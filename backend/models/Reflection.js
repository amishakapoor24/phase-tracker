const mongoose = require('mongoose');

const reflectionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phaseId: { type: String, required: true },
  type: { type: String, enum: ['reflection1', 'final-reflection'], required: true },
  content: { type: String, required: true },
  approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest', default: null },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  feedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

reflectionSchema.index({ student: 1, phaseId: 1, type: 1, status: 1 });

module.exports = mongoose.model('Reflection', reflectionSchema);
