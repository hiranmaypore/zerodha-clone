const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  orderType: { type: String, enum: ['MARKET', 'LIMIT'], default: 'MARKET' },
  productType: { type: String, enum: ['CNC', 'MIS'], default: 'CNC' }, // CNC = long-term, MIS = intraday
  limitPrice: { type: Number }, // Required if orderType is LIMIT
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Execution Price
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED', 'GTT_ACTIVE'], default: 'PENDING' },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  // GTT Fields
  isGTT: { type: Boolean, default: false },
  triggerPrice: { type: Number },
  expiryDate: { type: Date },
  // Advanced Order Fields
  orderCategory: {
    type: String,
    enum: ['REGULAR', 'STOPLOSS', 'BRACKET', 'TARGET'],
    default: 'REGULAR'
  },
  stopLossPrice: { type: Number }, // For stop-loss & bracket
  targetPrice: { type: Number },   // For bracket orders
  parentOrderId: {                 // For bracket legs
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  executedAt: { type: Date },      // Set when order is filled
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
