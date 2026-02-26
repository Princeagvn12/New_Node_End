require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB } = require('./src/config/db');

// connect to DB immediately when app is required
connectDB().catch(err => {
  // If DB connection fails, log and continue — server may retry/exit elsewhere
  console.error('Failed to connect to DB on app startup:', err.message || err);
});

const routes = require('./src/routes/index');
const errorMiddleware = require('./src/middlewares/error.middleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

// CORS: allow credentials and only explicit client origins
const allowedOrigins = (
  process.env.CLIENT_ORIGIN || 'http://localhost:5173,https://gestion-learn.vercel.app'
)
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};
app.use(cors(corsOptions));

// Mount API routes
app.use('/api', routes);

// Error handler (should be last)
app.use(errorMiddleware);

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
