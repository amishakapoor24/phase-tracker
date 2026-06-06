const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

let transporter;

const initTransporter = async () => {
  if (transporter) return transporter;

  const hasConfig = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  
  if (hasConfig) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    console.log('No SMTP config found. Creating an Ethereal test account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal account created. Username: ${testAccount.user}`);
    } catch (err) {
      console.warn('Failed to create Ethereal account, falling back to mock logger.', err.message);
      transporter = {
        sendMail: async (mailOptions) => {
          console.log('[MOCK EMAIL SENT]', mailOptions);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html, type = 'custom' }) => {
  try {
    const activeTransporter = await initTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"PhaseTracker" <noreply@phasetracker.com>',
      to,
      subject,
      html
    };

    const info = await activeTransporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.messageId}`);
    
    await Notification.create({
      recipient: to,
      subject,
      body: html,
      type,
      status: 'sent'
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    await Notification.create({
      recipient: to,
      subject,
      body: html,
      type,
      status: 'failed',
      error: err.message
    });
    return false;
  }
};

const getWelcomeTemplate = (name) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #4f46e5; margin-bottom: 20px;">Welcome to PhaseTracker, ${name}! 🎉</h2>
    <p>Your account has been successfully created. We are excited to have you on board.</p>
    <p>Log in to your dashboard to view your learning path, start quizzes, and complete sub-phases.</p>
    <div style="margin-top: 30px; text-align: center;">
      <a href="http://localhost:3000/login" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
    </div>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="font-size: 12px; color: #64748b; text-align: center;">PhaseTracker team</p>
  </div>
`;

const getStatusUpdateTemplate = (name, phaseName, subPhaseName, status, mentorFeedback) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: ${status === 'approved' ? '#10b981' : '#ef4444'}; margin-bottom: 20px;">
      Submission ${status === 'approved' ? 'Approved! ✅' : 'Rejected ❌'}
    </h2>
    <p>Hi ${name},</p>
    <p>Your mentor has reviewed your submission for <strong>${phaseName} - ${subPhaseName}</strong>.</p>
    <p><strong>Status:</strong> <span style="text-transform: capitalize; font-weight: bold; color: ${status === 'approved' ? '#10b981' : '#ef4444'};">${status}</span></p>
    ${mentorFeedback ? `<p><strong>Feedback:</strong> "${mentorFeedback}"</p>` : ''}
    <div style="margin-top: 30px; text-align: center;">
      <a href="http://localhost:3000/phase/${phaseName.toLowerCase()}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Details</a>
    </div>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="font-size: 12px; color: #64748b; text-align: center;">PhaseTracker team</p>
  </div>
`;

const getReflectionReadyTemplate = (name, phaseName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #4f46e5; margin-bottom: 20px;">Reflection Ready! 🎯</h2>
    <p>Hi ${name},</p>
    <p>Congratulations on completing all the sub-phases of <strong>${phaseName}</strong>!</p>
    <p>You can now start and submit your Phase Reflection from the dashboard to complete the phase and unlock the next stage.</p>
    <div style="margin-top: 30px; text-align: center;">
      <a href="http://localhost:3000/phase/${phaseName.toLowerCase()}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Start Reflection</a>
    </div>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="font-size: 12px; color: #64748b; text-align: center;">PhaseTracker team</p>
  </div>
`;

const getForgotPasswordTemplate = (resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
    <h2 style="color: #4f46e5; margin-bottom: 20px;">Password Reset Request</h2>
    <p>You are receiving this email because you (or someone else) has requested the reset of a password.</p>
    <p>Please click the button below to reset your password. This link is valid for 10 minutes.</p>
    <div style="margin-top: 30px; text-align: center;">
      <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
    </div>
    <p style="margin-top: 20px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;" />
    <p style="font-size: 12px; color: #64748b; text-align: center;">PhaseTracker team</p>
  </div>
`;

module.exports = {
  sendEmail,
  getWelcomeTemplate,
  getStatusUpdateTemplate,
  getReflectionReadyTemplate,
  getForgotPasswordTemplate
};
