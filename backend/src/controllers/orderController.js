const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getPrices } = require('../services/priceSimulator');
const crypto = require('crypto');
const notifications = require('../services/orderNotifications');

// ─── In-memory helpers ──────────────────────────────────────────────────────────
function memBuyStock(userId, stockSymbol, quantity, orderType, limitPrice, currentPrice, productType) {
  const mem = global.inMemoryDB;
  const user = mem.users.get(userId);
  if (!user) return { error: 'User not found', status: 404 };

  const executionPrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
  const totalCost = executionPrice * quantity;
  if (user.balance < totalCost) return { error: 'Insufficient funds', status: 400 };

  user.balance -= totalCost;

  const today = new Date().toISOString().slice(0, 10);
  const order = {
    _id: crypto.randomUUID(), user: userId, stock: stockSymbol, type: 'BUY',
    orderType: orderType || 'MARKET', limitPrice: orderType === 'LIMIT' ? limitPrice : undefined,
    productType: productType || 'CNC',
    quantity, price: executionPrice,
    status: orderType === 'LIMIT' ? 'PENDING' : 'COMPLETED',
    createdAt: new Date().toISOString(),
  };
  mem.orders.set(order._id, order);

  if (orderType !== 'LIMIT') {
    const hKey = `${userId}:${stockSymbol}:${productType || 'CNC'}:${today}`;
    const holding = mem.holdings.get(hKey);
    if (holding) {
      const newQty = holding.quantity + quantity;
      holding.avgPrice = (holding.quantity * holding.avgPrice + totalCost) / newQty;
      holding.quantity = newQty;
    } else {
      mem.holdings.set(hKey, { user: userId, stock: stockSymbol, quantity, avgPrice: currentPrice, productType: productType || 'CNC', tradeDate: today });
    }
  }
  if (order.status === 'COMPLETED') {
    notifications.notifyOrderExecuted(order);
  }
  return { order };
}

function memSellStock(userId, stockSymbol, quantity, currentPrice, productType) {
  const mem = global.inMemoryDB;
  const user = mem.users.get(userId);
  if (!user) return { error: 'User not found', status: 404 };

  // Holdings are keyed as userId:stock:productType:date — scan for a match
  const pType = productType || 'CNC';
  const prefix = `${userId}:${stockSymbol}:`;
  let holdingKey = null;
  let holding = null;
  for (const [key, h] of mem.holdings) {
    if (key.startsWith(prefix) && (!productType || h.productType === pType)) {
      holdingKey = key;
      holding = h;
      break;
    }
  }

  if (!holding || holding.quantity < quantity) {
    return { error: 'Insufficient holdings', status: 400 };
  }

  const totalRevenue = currentPrice * quantity;
  user.balance += totalRevenue;
  holding.quantity -= quantity;
  if (holding.quantity === 0) mem.holdings.delete(holdingKey);

  const order = {
    _id: require('crypto').randomUUID(), user: userId, stock: stockSymbol, type: 'SELL',
    orderType: 'MARKET', quantity, price: currentPrice, status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  };
  mem.orders.set(order._id, order);
  if (order.status === 'COMPLETED') {
    notifications.notifyOrderExecuted(order);
  }
  return { order };
}

// ─── Buy Stock ─────────────────────────────────────────────────────────────────
exports.buyStock = async (req, res) => {
  const { stockSymbol, quantity, orderType, limitPrice, productType } = req.body;
  const userId = req.user._id || req.user.id;

  if (!stockSymbol || !quantity || quantity <= 0)
    return res.status(400).json({ message: 'Invalid stock or quantity' });
  if (orderType === 'LIMIT' && (!limitPrice || limitPrice <= 0))
    return res.status(400).json({ message: 'Limit price required for Limit Orders' });

  const prices = getPrices();
  let currentPrice = prices[stockSymbol];
  
  if (!currentPrice) {
    // Check if it's an options contract from the UI (e.g. NIFTY_22000_CE_7D)
    if (stockSymbol.includes('_CE_') || stockSymbol.includes('_PE_')) {
      currentPrice = req.body.quotedPrice || req.body.limitPrice;
    }
    
    if (!currentPrice) {
      return res.status(400).json({ message: 'Stock price not available' });
    }
  }

  if (!global.dbConnected) {
    const result = memBuyStock(userId, stockSymbol, quantity, orderType, limitPrice, currentPrice, productType);
    if (result.error) return res.status(result.status).json({ message: result.error });
    return res.status(201).json(result.order);
  }

  try {
    const executionPrice = orderType === 'LIMIT' ? limitPrice : currentPrice;
    const totalCost = executionPrice * quantity;
    const user = await User.findById(userId);
    if (user.balance < totalCost)
      return res.status(400).json({ message: 'Insufficient funds' });

    user.balance -= totalCost;
    await user.save();

    if (orderType === 'LIMIT') {
      const order = await Order.create({
        user: userId, stock: stockSymbol, type: 'BUY', orderType: 'LIMIT',
        productType: productType || 'CNC',
        limitPrice, quantity, price: limitPrice, status: 'PENDING'
      });
      return res.status(201).json(order);
    }

    const today = new Date().toISOString().slice(0, 10);
    const pType = productType || 'CNC';
    let holding = await Holding.findOne({ user: userId, stock: stockSymbol, productType: pType, tradeDate: today });
    if (holding) {
      const newQty = holding.quantity + quantity;
      holding.avgPrice = (holding.quantity * holding.avgPrice + totalCost) / newQty;
      holding.quantity = newQty;
      await holding.save();
    } else {
      holding = await Holding.create({ user: userId, stock: stockSymbol, quantity, avgPrice: currentPrice, productType: pType, tradeDate: today });
    }

    const order = await Order.create({
      user: userId, stock: stockSymbol, type: 'BUY', orderType: 'MARKET',
      productType: pType,
      quantity, price: currentPrice, status: 'COMPLETED'
    });
    
    notifications.notifyOrderExecuted(order);
    res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during Buy' });
  }
};

// ─── Sell Stock ────────────────────────────────────────────────────────────────
exports.sellStock = async (req, res) => {
  const { stockSymbol, quantity, orderType, limitPrice, productType } = req.body;
  const userId = req.user._id || req.user.id;

  if (!stockSymbol || !quantity || quantity <= 0)
    return res.status(400).json({ message: 'Invalid stock or quantity' });

  const prices = getPrices();
  let currentPrice = prices[stockSymbol];
  
  if (!currentPrice) {
    if (stockSymbol.includes('_CE_') || stockSymbol.includes('_PE_')) {
      currentPrice = req.body.quotedPrice || req.body.limitPrice;
    }
    
    if (!currentPrice) {
      return res.status(400).json({ message: 'Stock price not available' });
    }
  }

  if (!global.dbConnected) {
    const result = memSellStock(userId, stockSymbol, quantity, currentPrice, productType);
    if (result.error) return res.status(result.status).json({ message: result.error });
    return res.status(201).json(result.order);
  }

  try {
    let holding = await Holding.findOne({ user: userId, stock: stockSymbol });
    if (holding && holding.quantity > 0) {
      if (holding.quantity < quantity)
        return res.status(400).json({ message: 'Insufficient holdings' });
      const totalRevenue = currentPrice * quantity;
      const user = await User.findById(userId);
      user.balance += totalRevenue;
      await user.save();
      holding.quantity -= quantity;
      if (holding.quantity === 0) await Holding.deleteOne({ _id: holding._id });
      else await holding.save();
    } else {
      const totalRevenue = currentPrice * quantity;
      const user = await User.findById(userId);
      user.balance += totalRevenue;
      await user.save();
      if (holding) {
        holding.quantity -= quantity;
        await holding.save();
      } else {
        await Holding.create({ user: userId, stock: stockSymbol, quantity: -quantity, avgPrice: currentPrice, isShort: true });
      }
    }

    const order = await Order.create({
      user: userId, stock: stockSymbol, type: 'SELL',
      orderType: orderType || 'MARKET', quantity, price: currentPrice, status: 'COMPLETED'
    });
    
    notifications.notifyOrderExecuted(order);
    return res.status(201).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error during Sell' });
  }
};

// ─── Get Orders ────────────────────────────────────────────────────────────────
const getOrders = async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!global.dbConnected) {
    const mem = global.inMemoryDB;
    const orders = [];
    for (const [, o] of mem.orders) {
      if (o.user === userId || o.user?.toString() === userId?.toString()) orders.push(o);
    }
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json(orders);
  }
  try {
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
};

// ─── Cancel Order ──────────────────────────────────────────────────────────────
const cancelOrder = async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user._id || req.user.id;

  if (!global.dbConnected) {
    const mem = global.inMemoryDB;
    const order = mem.orders.get(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'PENDING') return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });
    order.status = 'CANCELLED';
    order.cancelledAt = new Date().toISOString();
    // Refund
    const user = mem.users.get(userId);
    if (user && order.type === 'BUY') user.balance += order.price * order.quantity;
    
    notifications.notifyOrderCancelled(order);
    return res.json({ success: true, message: 'Order cancelled', order });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId.toString())
      return res.status(403).json({ message: 'Unauthorized to cancel this order' });
    if (order.status !== 'PENDING')
      return res.status(400).json({ message: `Cannot cancel order with status: ${order.status}` });

    const user = await User.findById(userId);
    if (order.type === 'BUY') user.balance += (order.price || order.limitPrice) * order.quantity;
    order.status = 'CANCELLED';
    order.cancelledAt = new Date();
    order.cancelReason = 'User cancelled';
    await user.save();
    await order.save();
    notifications.notifyOrderCancelled(order);

    res.json({ success: true, message: 'Order cancelled successfully', order: { orderId: order._id, status: order.status } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { buyStock: exports.buyStock, sellStock: exports.sellStock, getOrders, cancelOrder };
