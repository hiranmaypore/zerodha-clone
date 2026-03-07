const mongoose = require('mongoose');

const SignalSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  name: { type: String },
  trend: { type: String, enum: ['BULLISH', 'BEARISH'], required: true },
  price: { type: Number, required: true },
  strategy: { type: String, default: 'EMA Crossover' },
  strength: { type: Number },
  timestamp: { type: Date, default: Date.now },
  indicators: {
    fastEMA: Number,
    slowEMA: Number,
    rsi: Number
  }
});

module.exports = mongoose.model('Signal', SignalSchema);
