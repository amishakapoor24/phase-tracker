const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, enum: ['welcome', 'approval_request', 'status_update', 'custom'], default: 'custom' },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
  error: { type: String, default: '' },
  sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
