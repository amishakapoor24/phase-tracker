const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phaseId: { type: String, required: true },
  subPhaseId: { type: String, required: true },
  githubLink: { type: String, default: '' },
  deploymentLink: { type: String, default: '' },
  videoLink: { type: String, default: '' },
  submissionMessage: { type: String, default: '' },
  reflection: { type: String, default: '' },
  attachments: [{ type: String }],
  approvalRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRequest', default: null },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
  feedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

submissionSchema.index({ student: 1, phaseId: 1, subPhaseId: 1, status: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
