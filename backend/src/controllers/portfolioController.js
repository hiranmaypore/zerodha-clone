const Holding = require('../models/Holding');
const User = require('../models/User');
const Order = require('../models/Order');
const { getPrices } = require('../services/priceSimulator');
const STOCKS = require('../config/stocks');
const { parse } = require('json2csv');
const logger = require('../utils/logger');

function enrichHolding(h, prices) {
  const currentPrice = prices[h.stock] || 0;
  const investedValue = h.avgPrice * Math.abs(h.quantity);
  const currentValue = currentPrice * Math.abs(h.quantity);
  const pnl = h.quantity > 0 ? currentValue - investedValue : investedValue - currentValue;
  const pnlPercent = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
  const stockInfo = STOCKS.find(s => s.symbol === h.stock);
  return {
    _id: h._id || `${h.user}:${h.stock}`,
    stock: h.stock,
    name: stockInfo ? stockInfo.name : h.stock,
    quantity: h.quantity,
    avgPrice: parseFloat((h.avgPrice || 0).toFixed(2)),
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    investedValue: parseFloat(investedValue.toFixed(2)),
    currentValue: parseFloat(currentValue.toFixed(2)),
    pnl: parseFloat(pnl.toFixed(2)),
    pnlPercent: parseFloat(pnlPercent.toFixed(2)),
    isShort: h.quantity < 0,
  };
}

// ─── Get Holdings ──────────────────────────────────────────
exports.getHoldings = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const prices = getPrices();

  if (!global.dbConnected) {
    const mem = global.inMemoryDB;
    const holdings = [];
    for (const [key, h] of mem.holdings) {
      if (key.startsWith(userId + ':')) holdings.push(h);
    }
    return res.json({ success: true, count: holdings.length, holdings: holdings.map(h => enrichHolding(h, prices)) });
  }

  try {
    const holdings = await Holding.find({ user: userId, productType: { $ne: 'MIS' } });
    res.json({ success: true, count: holdings.length, holdings: holdings.map(h => enrichHolding(h, prices)) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching holdings', error: error.message });
  }
};

// ─── Get Positions (Intraday / MIS) ────────────────────────────────
exports.getPositions = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const prices = getPrices();
  const today = new Date().toISOString().slice(0, 10);

  if (!global.dbConnected) {
    const mem = global.inMemoryDB;
    const positions = [];
    for (const [key, h] of mem.holdings) {
      if (key.startsWith(userId + ':') && h.productType === 'MIS' && h.tradeDate === today) {
        positions.push(h);
      }
    }
    return res.json({ success: true, count: positions.length, positions: positions.map(h => enrichHolding(h, prices)) });
  }

  try {
    const positions = await Holding.find({ user: userId, productType: 'MIS', tradeDate: today });
    res.json({ success: true, count: positions.length, positions: positions.map(h => enrichHolding(h, prices)) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching positions', error: error.message });
  }
};


// ─── Get Dashboard ─────────────────────────────────────────
exports.getDashboard = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const prices = getPrices();

  if (!global.dbConnected) {
    const mem = global.inMemoryDB;
    const user = mem.users.get(userId) || req.user;
    let totalInvested = 0, totalCurrentValue = 0;
    for (const [key, h] of mem.holdings) {
      if (key.startsWith(userId + ':')) {
        const currentPrice = prices[h.stock] || 0;
        totalInvested += h.avgPrice * Math.abs(h.quantity);
        totalCurrentValue += currentPrice * Math.abs(h.quantity);
      }
    }
    const orders = [];
    for (const [, o] of mem.orders) {
      if (o.user === userId) orders.push(o);
    }
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalPnl = totalCurrentValue - totalInvested;
    return res.json({
      success: true,
      dashboard: {
        user: { name: user.name, email: user.email, balance: parseFloat((user.balance || 0).toFixed(2)) },
        portfolio: {
          totalInvested: parseFloat(totalInvested.toFixed(2)),
          currentValue: parseFloat(totalCurrentValue.toFixed(2)),
          totalPnl: parseFloat(totalPnl.toFixed(2)),
          totalPnlPercent: totalInvested > 0 ? parseFloat(((totalPnl / totalInvested) * 100).toFixed(2)) : 0,
          holdingsCount: [...mem.holdings].filter(([k]) => k.startsWith(userId + ':')).length,
        },
        netWorth: parseFloat(((user.balance || 0) + totalCurrentValue).toFixed(2)),
        recentOrders: orders.slice(0, 5),
      }
    });
  }

  try {
    const user = await User.findById(userId).select('-password');
    const holdings = await Holding.find({ user: userId });
    let totalInvested = 0, totalCurrentValue = 0;
    holdings.forEach(h => {
      const currentPrice = prices[h.stock] || 0;
      totalInvested += h.avgPrice * h.quantity;
      totalCurrentValue += currentPrice * h.quantity;
    });
    const totalPnl = totalCurrentValue - totalInvested;
    const recentOrders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean();
    res.json({
      success: true,
      dashboard: {
        user: { name: user.name, email: user.email, balance: parseFloat(user.balance.toFixed(2)) },
        portfolio: {
          totalInvested: parseFloat(totalInvested.toFixed(2)),
          currentValue: parseFloat(totalCurrentValue.toFixed(2)),
          totalPnl: parseFloat(totalPnl.toFixed(2)),
          totalPnlPercent: totalInvested > 0 ? parseFloat(((totalPnl / totalInvested) * 100).toFixed(2)) : 0,
          holdingsCount: holdings.length,
        },
        netWorth: parseFloat((user.balance + totalCurrentValue).toFixed(2)),
        recentOrders,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard', error: error.message });
  }
};

// ─── Export Tax Statement (CSV) ──────────────────────────
exports.downloadTaxStatement = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let orders = [];

    if (!global.dbConnected) {
      // Memory Mode
      for (const [id, order] of global.inMemoryDB.orders) {
        if (order.user.toString() === userId.toString()) orders.push(order);
      }
    } else {
      // DB Mode
      orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    }

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No trading history found to export.' });
    }

    // Format Data for CSV
    const csvData = orders.map(o => {
      const execPrice = o.price || 0;
      const amount = o.quantity * execPrice;
      const type = o.type;
      
      return {
        'Date': new Date(o.createdAt || new Date()).toISOString().split('T')[0],
        'Time': new Date(o.createdAt || new Date()).toISOString().split('T')[1].substring(0, 8),
        'Symbol': o.stock,
        'Type': type,
        'Quantity': o.quantity,
        'Execution Price (₹)': execPrice.toFixed(2),
        'Total Value (₹)': amount.toFixed(2),
        'Status': o.status
      };
    });

    // Options for json2csv
    const fields = ['Date', 'Time', 'Symbol', 'Type', 'Quantity', 'Execution Price (₹)', 'Total Value (₹)', 'Status'];
    const csv = parse(csvData, { fields });

    logger.info(`📄 P&L Tax Statement generated for user ${userId}`);

    // Set headers to trigger a browser download
    res.header('Content-Type', 'text/csv');
    res.attachment(`ZeroDha_Tax_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csv);

  } catch (error) {
    logger.error('Failed to generate Tax Statement:', error);
    res.status(500).json({ message: 'Failed to generate tax statement' });
  }
};

