/**
 * MIS Auto Square-Off Service
 *
 * Rules (matching real Zerodha behaviour):
 *  - At 15:15 IST → warn all users with open MIS positions
 *  - At 15:20 IST → force-close ALL open MIS holdings at current market price
 *
 * Works in BOTH in-memory (demo) and DB (live) modes.
 */

const { getPrices } = require('./priceSimulator');

// ── IST helpers ──────────────────────────────────────────────────────────────
const toIST = (d) => {
  // UTC+5:30 offset in ms
  const IST_OFFSET = 5.5 * 60 * 60 * 1000;
  return new Date(d.getTime() + IST_OFFSET);
};

const istHHMM = (d) => {
  const ist = toIST(d);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes(); // minutes since midnight IST
};

const WARN_TIME  = 15 * 60 + 15;  // 15:15 IST in minutes
const SQOFF_TIME = 15 * 60 + 20;  // 15:20 IST in minutes

// Prevent firing more than once per day
let lastWarnDate  = '';
let lastSqOffDate = '';
let ioRef = null;

// ── Notify helpers ───────────────────────────────────────────────────────────
const notify = (userId, event, data) => {
  if (!ioRef) return;
  ioRef.to(String(userId)).emit(event, data);
};

// ── In-memory square-off ─────────────────────────────────────────────────────
const memSquareOff = () => {
  const mem    = global.inMemoryDB;
  const prices = getPrices();
  const today  = new Date().toISOString().slice(0, 10);
  let   count  = 0;

  for (const [key, h] of mem.holdings) {
    if (h.productType !== 'MIS' || h.tradeDate !== today) continue;

    const price = prices[h.stock] || h.avgPrice;
    const pnl   = (price - h.avgPrice) * h.quantity;

    // Credit / debit user
    const user = mem.users.get(h.user);
    if (user) {
      user.balance = (user.balance || 0) + price * h.quantity;
    }

    // Close the position via a synthetic SELL order
    mem.orders.set(`sqoff-${key}`, {
      _id:         `sqoff-${key}`,
      user:        h.user,
      stock:       h.stock,
      type:        'SELL',
      orderType:   'MARKET',
      productType: 'MIS',
      quantity:    h.quantity,
      price,
      status:      'COMPLETED',
      cancelReason:'MIS Auto Square-Off at 15:20',
      createdAt:   new Date().toISOString(),
    });

    mem.holdings.delete(key);
    count++;

    notify(h.user, 'mis_squaredoff', {
      stock: h.stock, quantity: h.quantity, price, pnl,
      message: `${h.stock} MIS position auto-squared off at ₹${price.toFixed(2)}`,
    });
  }

  if (count > 0) console.log(`⚡ MIS Auto Square-Off (demo): ${count} positions closed`);
};

// ── DB-backed square-off ─────────────────────────────────────────────────────
const dbSquareOff = async () => {
  const Order   = require('../models/Order');
  const Holding = require('../models/Holding');
  const User    = require('../models/User');
  const prices  = getPrices();
  const today   = new Date().toISOString().slice(0, 10);

  const positions = await Holding.find({ productType: 'MIS', tradeDate: today });
  if (!positions.length) return;

  let count = 0;
  for (const pos of positions) {
    try {
      const price = prices[pos.stock] || pos.avgPrice;
      const pnl   = (price - pos.avgPrice) * pos.quantity;

      // Return proceeds to user balance
      await User.findByIdAndUpdate(pos.user, { $inc: { balance: price * pos.quantity } });

      // Create the square-off order record
      await Order.create({
        user:        pos.user,
        stock:       pos.stock,
        type:        'SELL',
        orderType:   'MARKET',
        productType: 'MIS',
        quantity:    pos.quantity,
        price,
        status:      'COMPLETED',
        cancelReason:'MIS Auto Square-Off at 15:20',
        orderCategory: 'REGULAR',
      });

      // Remove the MIS holding
      await Holding.deleteOne({ _id: pos._id });
      count++;

      notify(String(pos.user), 'mis_squaredoff', {
        stock: pos.stock, quantity: pos.quantity, price, pnl,
        message: `${pos.stock} MIS position auto-squared off at ₹${price.toFixed(2)}`,
      });
    } catch (err) {
      console.error(`SQ-OFF error for ${pos.stock}:`, err.message);
    }
  }

  if (count > 0) console.log(`⚡ MIS Auto Square-Off (DB): ${count} positions closed`);
};

// ── Warning (15:15) ───────────────────────────────────────────────────────────
const sendSqOffWarning = async () => {
  try {
    if (!global.dbConnected) {
      const mem   = global.inMemoryDB;
      const today = new Date().toISOString().slice(0, 10);
      const users = new Set();
      for (const [, h] of mem.holdings) {
        if (h.productType === 'MIS' && h.tradeDate === today) users.add(h.user);
      }
      users.forEach(uid => notify(uid, 'mis_warning', {
        message: 'Your MIS positions will be auto-squared off at 15:20 IST',
        minutesLeft: 5,
      }));
    } else {
      const Holding = require('../models/Holding');
      const today   = new Date().toISOString().slice(0, 10);
      const positions = await Holding.find({ productType: 'MIS', tradeDate: today }).distinct('user');
      positions.forEach(uid => notify(String(uid), 'mis_warning', {
        message: 'Your MIS positions will be auto-squared off at 15:20 IST',
        minutesLeft: 5,
      }));
    }
  } catch (e) { /* silent */ }
};

// ── Scheduler loop (runs every 30s) ─────────────────────────────────────────
const startAutoSquareOffService = (io) => {
  ioRef = io;
  const today = () => new Date().toISOString().slice(0, 10);

  const tick = async () => {
    const nowIST = istHHMM(new Date());
    const date   = today();

    // 15:15 — warning
    if (nowIST >= WARN_TIME && nowIST < SQOFF_TIME && lastWarnDate !== date) {
      lastWarnDate = date;
      await sendSqOffWarning();
      console.log('⚠️  MIS Square-Off warning sent (15:15 IST)');
    }

    // 15:20 — execute
    if (nowIST >= SQOFF_TIME && lastSqOffDate !== date) {
      lastSqOffDate = date;
      console.log('⚡ MIS Auto Square-Off triggered (15:20 IST)');
      if (!global.dbConnected) {
        memSquareOff();
      } else {
        await dbSquareOff();
      }
    }
  };

  setInterval(tick, 30_000);   // check every 30 seconds
  tick();                       // also check immediately on startup
  console.log('🕒 MIS Auto Square-Off Service Started (checks every 30s, fires at 15:20 IST)');
};

module.exports = { startAutoSquareOffService };
