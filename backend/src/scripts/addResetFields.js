require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models/User'); // respecte ton export actuel

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb';

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const filter = {
    $or: [
      { resetCodeHash: { $exists: false } },
      { resetCodeExpiry: { $exists: false } }
    ]
  };

  const update = { $set: { resetCodeHash: null, resetCodeExpiry: null } };

  const res = await User.updateMany(filter, update);
  console.log(`Matched: ${res.matchedCount || res.n}, Modified: ${res.modifiedCount || res.nModified}`);

  await mongoose.disconnect();
  console.log('Done');
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});