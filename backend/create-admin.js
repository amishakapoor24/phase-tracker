require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected.');

    const adminEmail = 'admin@phasetracker.com';
    const exists = await User.findOne({ email: adminEmail });

    if (exists) {
      console.log('An admin account already exists with email:', adminEmail);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'password123',
      role: 'admin',
    });

    console.log('SUCCESS! Initial Admin Created.');
    console.log('---------------------------------');
    console.log(`Email: ${admin.email}`);
    console.log(`Password: password123`);
    console.log('---------------------------------');
    console.log('You can login with these credentials and create more mentors/admins from the Dashboard.');

    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
};

createAdmin();
