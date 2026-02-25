const { getPrices } = require('./priceSimulator');

// In-memory matching engine for demo mode
const memMatchingEngine = () => {
  setInterval(() => {
    try {
      const mem = global.inMemoryDB;
      if (!mem) return;
      const prices = getPrices();
      for (const [id, order] of mem.orders) {
        if (order.status !== 'PENDING') continue;
        const currentPrice = prices[order.stock];
        if (!currentPrice) continue;
        let executed = false;
        if (order.type === 'BUY' && currentPrice <= order.limitPrice) executed = true;
        if (order.type === 'SELL' && currentPrice >= order.limitPrice) executed = true;
        if (executed) {
          order.status = 'COMPLETED';
          order.price = currentPrice;
          order.executedAt = new Date().toISOString();
          // Update holdings
          const user = mem.users.get(order.user);
          const hKey = `${order.user}:${order.stock}`;
          const holding = mem.holdings.get(hKey);
          if (order.type === 'BUY') {
            const refund = (order.limitPrice - currentPrice) * order.quantity;
            if (refund > 0 && user) user.balance = (user.balance || 0) + refund;
            if (holding) {
              const newQty = holding.quantity + order.quantity;
              holding.avgPrice = (holding.quantity * holding.avgPrice + currentPrice * order.quantity) / newQty;
              holding.quantity = newQty;
            } else {
              mem.holdings.set(hKey, { user: order.user, stock: order.stock, quantity: order.quantity, avgPrice: currentPrice });
            }
          }
        }
      }
    } catch (e) { /* silent */ }
  }, 2000);
};

// DB-backed matching engine
const dbMatchingEngine = () => {
  const Order = require('../models/Order');
  const Holding = require('../models/Holding');
  const User = require('../models/User');
  let notifications;
  try { notifications = require('./orderNotifications'); } catch(e) { notifications = {}; }

  console.log('⚙️  Matching Engine Started (DB mode)...');

  setInterval(async () => {
    try {
      const prices = getPrices();
      if (!prices) return;
      const pendingOrders = await Order.find({ status: 'PENDING' });

      for (const order of pendingOrders) {
        const currentPrice = prices[order.stock];
        if (!currentPrice) continue;
        let executed = false;

        if (order.orderCategory === 'STOPLOSS' && order.type === 'SELL' && currentPrice <= order.stopLossPrice) {
          executed = true;
          const user = await User.findById(order.user);
          user.balance += currentPrice * order.quantity;
          await user.save();
        } else if (order.orderCategory === 'REGULAR' || !order.orderCategory) {
          if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
            executed = true;
            const refund = (order.limitPrice - currentPrice) * order.quantity;
            if (refund > 0) {
              const user = await User.findById(order.user);
              user.balance += refund;
              await user.save();
            }
            let holding = await Holding.findOne({ user: order.user, stock: order.stock });
            if (holding) {
              const newQty = holding.quantity + order.quantity;
              holding.avgPrice = (holding.quantity * holding.avgPrice + currentPrice * order.quantity) / newQty;
              holding.quantity = newQty;
              await holding.save();
            } else {
              await Holding.create({ user: order.user, stock: order.stock, quantity: order.quantity, avgPrice: currentPrice });
            }
          } else if (order.type === 'SELL' && currentPrice >= order.limitPrice) {
            executed = true;
            const user = await User.findById(order.user);
            user.balance += currentPrice * order.quantity;
            await user.save();
          }
        }

        if (executed) {
          order.status = 'COMPLETED';
          order.price = currentPrice;
          await order.save();
          if (notifications.notifyOrderExecuted) await notifications.notifyOrderExecuted(order);
        }
      }
    } catch (error) {
      // Silently swallow DB errors in matching engine
    }
  }, 2000);
};

const startMatchingEngine = () => {
  if (!global.dbConnected) {
    memMatchingEngine();
  } else {
    dbMatchingEngine();
  }
};

module.exports = startMatchingEngine;
