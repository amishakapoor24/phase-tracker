const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  body: { type: String, required: true, trim: true },
  audience: { type: String, enum: ['all', 'students', 'mentors', 'admins', 'house'], default: 'all' },
  house: { type: String, default: null },
  isPublished: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

announcementSchema.index({ audience: 1, house: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
