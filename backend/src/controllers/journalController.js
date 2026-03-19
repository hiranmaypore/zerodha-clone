const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getPrices } = require('../services/priceSimulator');
const STOCKS = require('../config/stocks');

// ── Match BUY/SELL pairs to compute real P&L ────────────────────────
function computeTrades(orders) {
  // Group by stock, then match BUYs to SELLs in FIFO order
  const byStock = {};
  orders.forEach(o => {
    if (!byStock[o.stock]) byStock[o.stock] = { buys: [], sells: [] };
    const entry = {
      id: o._id,
      qty: o.quantity,
      price: o.price,
      date: new Date(o.executedAt || o.createdAt),
      productType: o.productType || 'CNC',
    };
    if (o.type === 'BUY') byStock[o.stock].buys.push(entry);
    else byStock[o.stock].sells.push(entry);
  });

  const trades = [];

  for (const [stock, { buys, sells }] of Object.entries(byStock)) {
    // FIFO matching: for each SELL, consume from oldest BUY
    const buyQueue = [...buys]; // copy so we can mutate
    const stockInfo = STOCKS.find(s => s.symbol === stock);

    for (const sell of sells) {
      let sellQtyRemaining = sell.qty;

      while (sellQtyRemaining > 0 && buyQueue.length > 0) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(sellQtyRemaining, buy.qty);
        const pnl = (sell.price - buy.price) * matchedQty;
        const holdTimeMs = sell.date - buy.date;

        trades.push({
          stock,
          name: stockInfo?.name || stock,
          sector: stockInfo?.sector || 'Unknown',
          type: 'ROUND_TRIP',
          buyPrice: buy.price,
          sellPrice: sell.price,
          quantity: matchedQty,
          pnl: parseFloat(pnl.toFixed(2)),
          pnlPercent: buy.price > 0 ? parseFloat(((pnl / (buy.price * matchedQty)) * 100).toFixed(2)) : 0,
          holdTimeMs,
          entryDate: buy.date,
          exitDate: sell.date,
          productType: buy.productType,
        });

        buy.qty -= matchedQty;
        sellQtyRemaining -= matchedQty;
        if (buy.qty <= 0) buyQueue.shift();
      }
    }
  }

  // Sort by exit date descending (most recent first)
  trades.sort((a, b) => b.exitDate - a.exitDate);
  return trades;
}

function formatHoldTime(ms) {
  if (ms <= 0) return '0m';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  return `${days}d ${hrs % 24}h`;
}

exports.getTradeJournal = async (req, res) => {
  const userIdStr = (req.user._id || req.user.id).toString();

  try {
    let orders = [];
    if (!global.dbConnected) {
      orders = Array.from(global.inMemoryDB.orders.values())
        .filter(o => o.user.toString() === userIdStr && o.status === 'COMPLETED');
    } else {
      orders = await Order.find({ user: userIdStr, status: 'COMPLETED' }).sort({ executedAt: 1 }).lean();
    }

    const emptyStats = {
      winRate: 0,
      totalTrades: 0,
      profitByDay: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      avgHoldingTime: '0m',
      currentStreak: 0,
      maxStreak: 0,
      totalPnl: 0,
      bestTrade: null,
      worstTrade: null,
      holdingStats: [
        { label: 'Long-term (CNC)', value: '0%' },
        { label: 'Intraday (MIS)', value: '0%' },
      ],
      trades: [],
    };

    if (orders.length === 0) {
      return res.json({ success: true, stats: emptyStats });
    }

    // ── Compute matched round-trip trades ──
    const trades = computeTrades(orders);

    if (trades.length === 0) {
      // Orders exist but no matched sell-buy pairs yet
      emptyStats.totalTrades = orders.length;
      emptyStats.holdingStats = computeProductSplit(orders);
      return res.json({ success: true, stats: emptyStats });
    }

    // ── Win rate ──
    const wins = trades.filter(t => t.pnl > 0).length;
    const losses = trades.filter(t => t.pnl < 0).length;
    const winRate = trades.length > 0 ? parseFloat(((wins / trades.length) * 100).toFixed(1)) : 0;

    // ── Streaks (consecutive wins) ──
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    // Iterate from oldest to newest for streak calc
    const chronological = [...trades].reverse();
    for (const t of chronological) {
      if (t.pnl > 0) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    // Current streak is from NOW backwards
    for (let i = trades.length - 1; i >= 0; i--) {
      if (trades[i].pnl > 0) currentStreak++;
      else break;
    }

    // ── Total P&L ──
    const totalPnl = parseFloat(trades.reduce((s, t) => s + t.pnl, 0).toFixed(2));

    // ── Sharpe Ratio & Max Drawdown ──
    // Simple realized Sharpe based on trade returns
    const realizedReturns = trades.map(t => t.pnlPercent);
    const avgRet = realizedReturns.reduce((a, b) => a + b, 0) / (trades.length || 1);
    const variance = realizedReturns.reduce((s, r) => s + Math.pow(r - avgRet, 2), 0) / (trades.length || 1);
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? parseFloat((avgRet / stdDev).toFixed(2)) : 0;

    // Max Drawdown calculation from cumulative P&L curve
    let peak = 0;
    let maxDrawdown = 0;
    let cumulativePnl = 0;
    // Iterate chronological (oldest to newest) to track the curve
    [...trades].reverse().forEach(t => {
      cumulativePnl += t.pnl;
      if (cumulativePnl > peak) peak = cumulativePnl;
      const dd = peak - cumulativePnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    // ── Avg Holding Time ──
    const totalHoldTimeMs = trades.reduce((s, t) => s + (t.holdTimeMs || 0), 0);
    const avgHoldingTime = formatHoldTime(trades.length > 0 ? totalHoldTimeMs / trades.length : 0);

    // ── Profit by Day of Week ──
    const profitByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    trades.forEach(t => {
      const day = dayNames[t.exitDate.getDay()];
      profitByDay[day] += t.pnl;
    });
    // Round each day
    Object.keys(profitByDay).forEach(d => { profitByDay[d] = parseFloat(profitByDay[d].toFixed(2)); });

    // ── Best/Worst ──
    const best = trades.reduce((a, b) => (a.pnl > b.pnl ? a : b), trades[0]);
    const worst = trades.reduce((a, b) => (a.pnl < b.pnl ? a : b), trades[0]);

    // ── Product split ──
    const holdingStats = computeProductSplit(orders);

    res.json({
      success: true,
      stats: {
        totalTrades: trades.length,
        totalOrders: orders.length,
        winRate,
        wins,
        losses,
        currentStreak,
        maxStreak,
        avgHoldingTime,
        totalPnl,
        sharpeRatio,
        maxDrawdown,
        profitByDay,
        bestTrade: {
          stock: best.stock,
          pnl: best.pnl,
          pnlPercent: best.pnlPercent,
        },
        worstTrade: {
          stock: worst.stock,
          pnl: worst.pnl,
          pnlPercent: worst.pnlPercent,
        },
        holdingStats,
        // Latest 50 trades for the history table
        trades: trades.slice(0, 50).map(t => ({
          stock: t.stock,
          name: t.name,
          sector: t.sector,
          buyPrice: t.buyPrice,
          sellPrice: t.sellPrice,
          quantity: t.quantity,
          pnl: t.pnl,
          pnlPercent: t.pnlPercent,
          holdTime: formatHoldTime(t.holdTimeMs),
          entryDate: t.entryDate,
          exitDate: t.exitDate,
          productType: t.productType,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching journal', error: error.message });
  }
};

function computeProductSplit(orders) {
  const cncCount = orders.filter(o => (o.productType || 'CNC') === 'CNC').length;
  const misCount = orders.filter(o => o.productType === 'MIS').length;
  const total = cncCount + misCount || 1;
  return [
    { label: 'Long-term (CNC)', value: `${Math.round((cncCount / total) * 100)}%` },
    { label: 'Intraday (MIS)', value: `${Math.round((misCount / total) * 100)}%` },
  ];
}
