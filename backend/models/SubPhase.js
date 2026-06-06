const mongoose = require('mongoose');

const subPhaseSchema = new mongoose.Schema({
  phaseId: { type: String, required: true },
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  requirements: {
    githubRequired: { type: Boolean, default: false },
    deploymentRequired: { type: Boolean, default: false },
    videoRequired: { type: Boolean, default: false },
    reflectionRequired: { type: Boolean, default: true }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index for unique sub-phase within a phase
subPhaseSchema.index({ phaseId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('SubPhase', subPhaseSchema);
