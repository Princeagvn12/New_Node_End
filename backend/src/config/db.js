require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Connect to MongoDB using MONGO_URI from environment.
 * Exports an async function connectDB() that resolves when connected.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;
  console.log(uri);
  
  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment');
  }

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message || err);
    throw err;
  }
}

module.exports = { connectDB, mongoose };
