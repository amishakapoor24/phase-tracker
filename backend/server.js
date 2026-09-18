const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/error');

dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/phases', require('./routes/phases'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/subphases', require('./routes/subphases'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/admin/analytics', require('./routes/analytics'));
app.use('/api/analytics', require('./routes/analytics'));

app.get('/', (req, res) => res.json({ message: 'PhaseTracker API running' }));

app.use(errorHandler);

const connectToMongoAndStart = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required. Add it to backend/.env before starting the server.');
    process.exit(1);
  }

  const retryDelayMs = Number(process.env.MONGO_RETRY_DELAY_MS || 5000);

  while (true) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        dbName: process.env.MONGO_DB || 'test',
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000,
      });

      console.log(`MongoDB connected to database: ${mongoose.connection.name}`);
      app.listen(process.env.PORT, () =>
        console.log(`Server running on http://localhost:${process.env.PORT}`)
      );
      return;
    } catch (err) {
      console.error(`MongoDB connection error: ${err.message}`);
      console.error(`Retrying MongoDB connection in ${retryDelayMs}ms`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
};

connectToMongoAndStart();
