require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || '';

    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be configured in backend/.env');
    }
    if (adminPassword.length < 12) {
      throw new Error('ADMIN_PASSWORD must be at least 12 characters long');
    }

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected.');

    const exists = await User.findOne({ email: adminEmail });

    if (exists) {
      console.log('An admin account already exists with email:', adminEmail);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    console.log('SUCCESS! Initial Admin Created.');
    console.log('---------------------------------');
    console.log(`Email: ${admin.email}`);
    console.log('---------------------------------');
    console.log('Use the configured admin password to sign in.');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
