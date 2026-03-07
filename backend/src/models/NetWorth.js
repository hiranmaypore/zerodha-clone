const mongoose = require('mongoose');

const NetWorthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  netWorth: {
    type: Number,
    required: true
  },
  cash: {
    type: Number,
    required: true
  },
  holdingsValue: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NetWorth', NetWorthSchema);
