const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');
const notifications = require('./orderNotifications');


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
          const user = mem.users.get(order.user);
          const today = new Date().toISOString().slice(0, 10);
          const pType = order.productType || 'CNC';
          const hKey = `${order.user}:${order.stock}:${pType}:${today}`;
          const holding = mem.holdings.get(hKey);
          if (order.type === 'BUY') {
            const refund = (order.limitPrice - currentPrice) * order.quantity;
            if (refund > 0 && user) user.balance = (user.balance || 0) + refund;
            if (holding) {
              const newQty = holding.quantity + order.quantity;
              holding.avgPrice = (holding.quantity * holding.avgPrice + currentPrice * order.quantity) / newQty;
              holding.quantity = newQty;
            } else {
              mem.holdings.set(hKey, { user: order.user, stock: order.stock, quantity: order.quantity, avgPrice: currentPrice, productType: pType, tradeDate: today });
            }
          } else if (order.type === 'SELL') {
             if (user) user.balance = (user.balance || 0) + (currentPrice * order.quantity);
             if (holding) {
                holding.quantity -= order.quantity;
                if (holding.quantity <= 0) mem.holdings.delete(hKey);
             }
          }
          notifications.notifyOrderExecuted(order);
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

  logger.info('⚙️  Matching Engine Started (DB mode)...');

  setInterval(async () => {
    try {
      const prices = getPrices();
      if (!prices) return;
      const pendingOrders = await Order.find({ status: 'PENDING' });


      for (const order of pendingOrders) {
        const currentPrice = prices[order.stock];
        if (!currentPrice) continue;
        let executed = false;
        const today = new Date().toISOString().slice(0, 10);
        const pType = order.productType || 'CNC';

        // ── GTT Trigger Logic ─────────────────────────────────────────
        if (order.isGTT && order.status === 'GTT_ACTIVE') {
          let triggered = false;
          if (order.type === 'BUY' && currentPrice <= order.triggerPrice) triggered = true;
          if (order.type === 'SELL' && currentPrice >= order.triggerPrice) triggered = true;
          
          if (triggered) {
            order.status = 'PENDING'; // Convert to active pending order
            await order.save();
            if (notifications.notifyOrderTriggered) await notifications.notifyOrderTriggered(order);
            continue; // Will be processed in next tick as PENDING
          }
        }

        // ── Stop-Loss trigger ─────────────────────────────────────────
        if (order.orderCategory === 'STOPLOSS' && order.type === 'SELL' && currentPrice <= order.stopLossPrice) {
          executed = true;
          const user = await User.findById(order.user);
          user.balance += currentPrice * order.quantity;
          await user.save();

        // ── Bracket order: target hit ─────────────────────────────────
        } else if (order.orderCategory === 'BRACKET' && order.type === 'BUY' && order.status === 'PENDING') {
          // First check: entry fill (limit buy)
          if (currentPrice <= order.limitPrice) {
            executed = true;
            const refund = (order.limitPrice - currentPrice) * order.quantity;
            const user = await User.findById(order.user);
            if (refund > 0) { user.balance += refund; await user.save(); }

            let holding = await Holding.findOne({ user: order.user, stock: order.stock, productType: pType, tradeDate: today });
            if (holding) {
              const newQty = holding.quantity + order.quantity;
              holding.avgPrice = (holding.quantity * holding.avgPrice + currentPrice * order.quantity) / newQty;
              holding.quantity = newQty;
              await holding.save();
            } else {
              await Holding.create({ user: order.user, stock: order.stock, quantity: order.quantity, avgPrice: currentPrice, productType: pType, tradeDate: today });
            }

            // Spawn SL + Target child orders
            if (order.stopLossPrice) {
              await Order.create({
                user: order.user, stock: order.stock, type: 'SELL', orderType: 'MARKET',
                orderCategory: 'STOPLOSS', stopLossPrice: order.stopLossPrice,
                productType: pType, quantity: order.quantity, price: order.stopLossPrice, status: 'PENDING',
                parentOrderId: order._id,
              });
            }
            if (order.targetPrice) {
              await Order.create({
                user: order.user, stock: order.stock, type: 'SELL', orderType: 'LIMIT',
                orderCategory: 'TARGET',           // distinct from REGULAR — processed by TARGET branch below
                limitPrice: order.targetPrice,
                productType: pType, quantity: order.quantity, price: order.targetPrice, status: 'PENDING',
                parentOrderId: order._id,
              });
            }
          }

        // ── Regular LIMIT + TARGET orders ─────────────────────────────
        } else if (['REGULAR', 'TARGET'].includes(order.orderCategory) || !order.orderCategory) {
          if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
            executed = true;
            const refund = (order.limitPrice - currentPrice) * order.quantity;
            if (refund > 0) {
              const user = await User.findById(order.user);
              user.balance += refund;
              await user.save();
            }
            let holding = await Holding.findOne({ user: order.user, stock: order.stock, productType: pType, tradeDate: today });
            if (holding) {
              const newQty = holding.quantity + order.quantity;
              holding.avgPrice = (holding.quantity * holding.avgPrice + currentPrice * order.quantity) / newQty;
              holding.quantity = newQty;
              await holding.save();
            } else {
              await Holding.create({ user: order.user, stock: order.stock, quantity: order.quantity, avgPrice: currentPrice, productType: pType, tradeDate: today });
            }
          } else if (order.type === 'SELL' && currentPrice >= order.limitPrice) {
            executed = true;
            const user = await User.findById(order.user);
            user.balance += currentPrice * order.quantity;
            await user.save();

            // Deduct from the holding (or delete it when qty reaches zero)
            const holding = await Holding.findOne({ user: order.user, stock: order.stock, productType: pType });
            
            // Create Trade Ledger Entry for Journal/Analytics
            if (holding) {
              const Trade = require('../models/Trade');
              const STOCKS = require('../config/stocks');
              const stockMeta = STOCKS.find(s => s.symbol === order.stock);
              
              const pnl = (currentPrice - holding.avgPrice) * order.quantity;
              const pnlPercent = holding.avgPrice > 0 ? (pnl / (holding.avgPrice * order.quantity)) * 100 : 0;
              
              await Trade.create({
                user: order.user,
                stock: order.stock,
                sector: stockMeta?.sector || 'Unknown',
                buyPrice: holding.avgPrice,
                entryDate: holding.createdAt || holding.updatedAt,
                sellOrderId: order._id,
                sellPrice: currentPrice,
                exitDate: new Date(),
                quantity: order.quantity,
                pnl,
                pnlPercent,
                isWin: pnl > 0,
                dayOfWeek: new Date().getDay(),
                productType: pType,
              });

              holding.quantity -= order.quantity;
              if (holding.quantity <= 0) await Holding.deleteOne({ _id: holding._id });
              else await holding.save();
            }

            // OCO: cancel the sibling bracket leg (SL if target hit, or target if SL hit)
            if (order.parentOrderId) {
              await Order.updateMany(
                { parentOrderId: order.parentOrderId, _id: { $ne: order._id }, status: 'PENDING' },
                { status: 'CANCELLED', cancelReason: 'Sibling order filled (OCO)' }
              );
            }
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
