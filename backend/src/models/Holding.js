const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: String, required: true },
  quantity: { type: Number, required: true }, // Can be negative for Short Selling
  avgPrice: { type: Number, required: true },
  isShort: { type: Boolean, default: false }, // Flag for easy UI filtering
  productType: { type: String, enum: ['CNC', 'MIS'], default: 'CNC' }, // CNC = long-term, MIS = intraday
  tradeDate: { type: String, default: () => new Date().toISOString().slice(0, 10) }, // YYYY-MM-DD
}, { timestamps: true });

module.exports = mongoose.model('Holding', holdingSchema);
