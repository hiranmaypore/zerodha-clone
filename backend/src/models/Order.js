const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL'], required: true },
  orderType: { type: String, enum: ['MARKET', 'LIMIT'], default: 'MARKET' },
  limitPrice: { type: Number }, // Required if orderType is LIMIT
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }, // Execution Price (or Target Price for Limit)
  status: { type: String, enum: ['PENDING', 'COMPLETED', 'REJECTED', 'CANCELLED'], default: 'PENDING' },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  // Advanced Order Fields
  orderCategory: {
    type: String,
    enum: ['REGULAR', 'STOPLOSS', 'BRACKET'],
    default: 'REGULAR'
  },
  stopLossPrice: { type: Number }, // For stop-loss & bracket
  targetPrice: { type: Number },     // For bracket orders
  parentOrderId: {                   // For bracket legs
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
