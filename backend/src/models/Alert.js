const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stock: {
    type: String,
    required: true,
  },
  condition: {
    type: String,
    enum: ['ABOVE', 'BELOW'],
    required: true,
  },
  targetPrice: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  triggeredAt: {
    type: Date,
  }
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);
