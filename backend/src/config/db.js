const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn('⚠️  MONGO_URI not set — running without database (demo mode)');
    return false;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Give up fast if Atlas unreachable
      connectTimeoutMS: 5000,
    });
    console.log('✅ MongoDB Connected');
    isConnected = true;
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
    console.warn('⚠️  Continuing in demo mode (no database). Orders/auth will use in-memory fallback.');
    return false;
  }
};

const getIsConnected = () => isConnected;

module.exports = connectDB;
module.exports.getIsConnected = getIsConnected;
