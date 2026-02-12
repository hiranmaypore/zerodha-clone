const Order = require('../models/Order');
const User = require('../models/User');
const Holding = require('../models/Holding');
const { getPrices } = require('../services/priceSimulator');

/**
 * Place a Stop-Loss Order
 * POST /api/orders/stop-loss
 */
const placeStopLoss = async (req, res) => {
  try {
    const { stockSymbol, quantity, triggerPrice, orderType } = req.body;
    const userId = req.user._id;

    if (!stockSymbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid stock or quantity' });
    }

    if (!triggerPrice || triggerPrice <= 0) {
      return res.status(400).json({ message: 'Trigger price is required for stop-loss orders' });
    }

    // Check if user has holdings to sell
    const holding = await Holding.findOne({ user: userId, stock: stockSymbol });
    
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient holdings for stop-loss order' });
    }

    // Block holdings
    holding.quantity -= quantity;
    if (holding.quantity === 0) {
      await Holding.deleteOne({ _id: holding._id });
    } else {
      await holding.save();
    }

    // Create PENDING stop-loss order
    const order = await Order.create({
      user: userId,
      stock: stockSymbol,
      type: 'SELL',
      orderType: orderType || 'MARKET',
      orderCategory: 'STOPLOSS',
      stopLossPrice: triggerPrice,
      quantity,
      price: triggerPrice,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Stop-loss order placed successfully',
      order: {
        orderId: order._id,
        stock: order.stock,
        type: order.type,
        quantity: order.quantity,
        triggerPrice: order.stopLossPrice,
        status: order.status
      }
    });

  } catch (error) {
    console.error('Place Stop-Loss Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Place a Bracket Order
 * POST /api/orders/bracket
 */
const placeBracketOrder = async (req, res) => {
  try {
    const { stockSymbol, quantity, entryPrice, targetPrice, stopLossPrice } = req.body;
    const userId = req.user._id;

    // Validation
    if (!stockSymbol || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid stock or quantity' });
    }

    if (!entryPrice || !targetPrice || !stopLossPrice) {
      return res.status(400).json({ message: 'Entry, target, and stop-loss prices are required' });
    }

    if (stopLossPrice >= entryPrice) {
      return res.status(400).json({ message: 'Stop-loss must be below entry price' });
    }

    if (targetPrice <= entryPrice) {
      return res.status(400).json({ message: 'Target must be above entry price' });
    }

    // Check balance for entry order
    const totalCost = entryPrice * quantity;
    const user = await User.findById(userId);
    
    if (user.balance < totalCost) {
      return res.status(400).json({ message: 'Insufficient funds for bracket order' });
    }

    // Deduct balance
    user.balance -= totalCost;
    await user.save();

    // Create entry order (LIMIT)
    const entryOrder = await Order.create({
      user: userId,
      stock: stockSymbol,
      type: 'BUY',
      orderType: 'LIMIT',
      orderCategory: 'BRACKET',
      limitPrice: entryPrice,
      targetPrice: targetPrice,
      stopLossPrice: stopLossPrice,
      quantity,
      price: entryPrice,
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Bracket order placed successfully',
      order: {
        orderId: entryOrder._id,
        stock: entryOrder.stock,
        quantity: entryOrder.quantity,
        entryPrice: entryOrder.limitPrice,
        targetPrice: entryOrder.targetPrice,
        stopLossPrice: entryOrder.stopLossPrice,
        status: entryOrder.status
      }
    });

  } catch (error) {
    console.error('Place Bracket Order Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  placeStopLoss,
  placeBracketOrder
};
