const AuditLog = require('../models/AuditLog');

const logAction = async (userId, action, ipAddress = '', details = {}) => {
  try {
    if (!userId) return;
    await AuditLog.create({
      user: userId,
      action,
      ipAddress,
      details
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = { logAction };
