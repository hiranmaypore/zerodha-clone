const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: String, required: true },
  sector: { type: String },
  // Entry (BUY) details
  buyOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  buyPrice: { type: Number, required: true },
  entryDate: { type: Date, required: true },
  // Exit (SELL) details
  sellOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  sellPrice: { type: Number, required: true },
  exitDate: { type: Date, required: true },
  // Trade metrics
  quantity: { type: Number, required: true },
  pnl: { type: Number, required: true },
  pnlPercent: { type: Number, required: true },
  holdTimeMs: { type: Number },
  productType: { type: String, enum: ['CNC', 'MIS'], default: 'CNC' },
  // Metadata
  isWin: { type: Boolean },
  dayOfWeek: { type: Number }, // 0=Sun, 6=Sat
}, { timestamps: true });

// Index for fast queries
tradeSchema.index({ user: 1, exitDate: -1 });
tradeSchema.index({ user: 1, isWin: 1 });

module.exports = mongoose.model('Trade', tradeSchema);
