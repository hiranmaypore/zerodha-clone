const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getPrices } = require('../services/priceSimulator');
const { notifyOrderCancelled } = require('../services/orderNotifications');

// @desc    Buy stock (Market or Limit)
// @route   POST /api/orders/buy
// @access  Private
exports.buyStock = async (req, res) => {
  const { stockSymbol, quantity, orderType, limitPrice } = req.body;
  const userId = req.user._id;

  if (!stockSymbol || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid stock or quantity' });
  }

  if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
    return res.status(400).json({ message: 'Limit price is required for Limit Orders' });
  }

  try {
    // 1. Get current price
    const prices = getPrices();
    const currentPrice = prices[stockSymbol];

    if (!currentPrice) {
      return res.status(400).json({ message: 'Stock price not available' });
    }

    // Determine cost basis
    // For MARKET: Cost = Current Price * Qty
    // For LIMIT: Cost = Limit Price * Qty (We block funds based on Limit Price)
    const executionPrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
    const totalCost = executionPrice * quantity;

    // 2. Check User Balance
    const user = await User.findById(userId);
    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // 3. Deduct Balance (Block funds immediately for both Market and Limit)
    user.balance -= totalCost;
    await user.save();

    // 4. Process Order based on Type
    if (orderType === 'LIMIT') {
      // Create PENDING Order
      const order = await Order.create({
        user: userId,
        stock: stockSymbol,
        type: 'BUY',
        orderType: 'LIMIT',
        limitPrice: limitPrice,
        quantity,
        price: limitPrice, // Target Price
        status: 'PENDING'
      });
      
      return res.status(201).json(order);
    } 
    
    // MARKET ORDER EXECUTION (Immediate)
    
    // Update Holding directly
    let holding = await Holding.findOne({ user: userId, stock: stockSymbol });

    if (holding) {
      const oldTotalValue = holding.quantity * holding.avgPrice;
      const newTotalValue = oldTotalValue + totalCost;
      const newQuantity = holding.quantity + quantity;
      
      holding.avgPrice = newTotalValue / newQuantity;
      holding.quantity = newQuantity;
      await holding.save();
    } else {
      holding = await Holding.create({
        user: userId,
        stock: stockSymbol,
        quantity: quantity,
        avgPrice: currentPrice
      });
    }

    // Create COMPLETED Order
    const order = await Order.create({
      user: userId,
      stock: stockSymbol,
      type: 'BUY',
      orderType: 'MARKET',
      quantity,
      price: currentPrice,
      status: 'COMPLETED'
    });

    res.status(201).json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during Buy' });
  }
};

// @desc    Sell stock (Market or Limit)
// @route   POST /api/orders/sell
// @access  Private
exports.sellStock = async (req, res) => {
  const { stockSymbol, quantity, orderType, limitPrice } = req.body;
  const userId = req.user._id;

  if (!stockSymbol || !quantity || quantity <= 0) {
    return res.status(400).json({ message: 'Invalid stock or quantity' });
  }

  if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0)) {
    return res.status(400).json({ message: 'Limit price is required for Limit Orders' });
  }

  try {
    // 1. Get current price
    const prices = getPrices();
    const currentPrice = prices[stockSymbol];

    if (!currentPrice) {
      return res.status(400).json({ message: 'Stock price not available' });
    }

    // 2. Check Holdings or Short Sell Availability
    let holding = await Holding.findOne({ user: userId, stock: stockSymbol });

    // SIMPLE SHORT SELLING MODEL
    // 1. If valid Long holding exists, Sell it.
    // 2. If no holding or Short holding exists, Enter/Add to Short.

    if (holding && holding.quantity > 0) {
        // LONG EXIT LOGIC
        if (holding.quantity < quantity) {
             return res.status(400).json({ message: 'Insufficient holdings (Partial short not supported)' });
        }
        
        // Update Balance
        const totalRevenue = currentPrice * quantity;
        const user = await User.findById(userId);
        user.balance += totalRevenue;
        await user.save();

        // Update Holding
        holding.quantity -= quantity;
        if (holding.quantity === 0) {
            await Holding.deleteOne({ _id: holding._id });
        } else {
            await holding.save();
        }

    } else {
        // SHORT ENTRY LOGIC
        // We credit cash, but tracking negative quantity.
        
        const totalRevenue = currentPrice * quantity;
        const user = await User.findById(userId);
        user.balance += totalRevenue;
        await user.save();

        if (holding) {
             // Already Short, adding to position
             const oldTotalValue = Math.abs(holding.quantity) * holding.avgPrice;
             const newTotalValue = oldTotalValue + (currentPrice * quantity);
             const newQuantity = Math.abs(holding.quantity) + quantity;

             holding.avgPrice = newTotalValue / newQuantity;
             holding.quantity -= quantity; // Becomes more negative
             await holding.save();
        } else {
            // New Short Position
            await Holding.create({
                user: userId,
                stock: stockSymbol,
                quantity: -quantity,
                avgPrice: currentPrice,
                isShort: true
            });
        }
    }

    // 3. Create Order Record (Standard)
    const order = await Order.create({
      user: userId,
      stock: stockSymbol,
      type: 'SELL',
      orderType: orderType || 'MARKET',
      quantity,
      price: currentPrice,
      status: 'COMPLETED'
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during Sell' });
  }
};

// @desc    Get user orders history
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) =>{
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Error fetching orders" });
    }
};

/**
 * Cancel a pending order
 * DELETE /api/orders/:orderId
 */
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    }

    // Check if order can be cancelled
    if (order.status !== 'PENDING') {
      return res.status(400).json({ 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    const user = await User.findById(userId);
    let refundAmount = 0;

    // Unblock funds or holdings based on order type
    if (order.type === 'BUY') {
      // Refund blocked funds
      refundAmount = order.price * order.quantity;
      user.balance += refundAmount;
      
    } else if (order.type === 'SELL') {
      // Unblock holdings
      const holding = await Holding.findOne({ 
        user: userId, 
        stock: order.stock 
      });
      
      if (holding) {
        holding.quantity += order.quantity;
        await holding.save();
      }
    }

    // Update order status
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancelReason = 'User cancelled';

    await user.save();
    await order.save();
    await notifyOrderCancelled(order);

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      order: {
        orderId: order._id,
        stock: order.stock,
        type: order.type,
        quantity: order.quantity,
        status: order.status,
        refundedAmount: refundAmount || null,
        cancelledAt: order.cancelledAt
      }
    });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { 
  buyStock: exports.buyStock, 
  sellStock: exports.sellStock, 
  getOrders, 
  cancelOrder 
};
