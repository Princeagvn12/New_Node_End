require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const { connectDB } = require('./config/db');

// connect to DB immediately when app is required
connectDB().catch(err => {
  // If DB connection fails, log and continue — server may retry/exit elsewhere
  console.error('Failed to connect to DB on app startup:', err.message || err);
});

const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

// CORS: allow credentials and the configured client origin
const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true,
};
app.use(cors(corsOptions));

// Mount API routes
app.use('/api', routes);

// Error handler (should be last)
app.use(errorMiddleware);

module.exports = app;
