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

// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
