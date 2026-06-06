const mongoose = require('mongoose');

const approvalRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phaseId: { type: String, required: true },
  subPhaseId: { type: String, required: true },
  type: { type: String, enum: ['subphase', 'reflection', 'reflection1', 'final-reflection'], default: 'subphase' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submissionMessage: { type: String, default: '' },
  githubLink: { type: String, default: '' },
  deploymentLink: { type: String, default: '' },
  videoLink: { type: String, default: '' },
  attachments: [{ type: String }],
  approvalMessage: { type: String, default: '' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now },
  approvedAt: { type: Date, default: null }
});

module.exports = mongoose.model('ApprovalRequest', approvalRequestSchema);
