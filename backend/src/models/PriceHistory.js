const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  symbol: { 
    type: String, 
    required: true,
    index: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  // OHLC data (for candlestick charts)
  open: Number,
  high: Number,
  low: Number,
  close: Number,
  volume: Number
}, { 
  timestamps: false // Using custom timestamp field
});

// Compound index for efficient queries by symbol and time range
priceHistorySchema.index({ symbol: 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
