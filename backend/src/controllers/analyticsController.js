const Holding = require('../models/Holding');
const Order = require('../models/Order');
const { getPrices } = require('../services/priceSimulator');
const STOCKS = require('../config/stocks');

exports.getPortfolioAnalytics = async (req, res) => {
  const userId = (req.user._id || req.user.id).toString();
  const prices = getPrices();

  try {
    let holdings = [];
    let orders = [];

    if (!global.dbConnected) {
      const mem = global.inMemoryDB;
      for (const [key, h] of mem.holdings) {
        if (key.startsWith(userId + ':')) holdings.push(h);
      }
      orders = Array.from(mem.orders.values())
        .filter(o => o.user.toString() === userId && o.status === 'COMPLETED');
    } else {
      holdings = await Holding.find({ user: userId }).lean();
      orders = await Order.find({ user: userId, status: 'COMPLETED' }).sort({ createdAt: -1 }).lean();
    }

    // ── Sector Allocation ──
    const sectorMap = {};
    let totalValue = 0;

    holdings.forEach(h => {
      const cp = prices[h.stock] || h.avgPrice || 0;
      const val = cp * Math.abs(h.quantity);
      totalValue += val;
      const info = STOCKS.find(s => s.symbol === h.stock);
      const sector = info?.sector || 'Other';
      sectorMap[sector] = (sectorMap[sector] || 0) + val;
    });

    const sectorAllocation = Object.entries(sectorMap)
      .map(([sector, value]) => ({
        sector,
        value: parseFloat(value.toFixed(2)),
        percent: totalValue > 0 ? parseFloat(((value / totalValue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    // ── Risk Metrics ──
    // Compute daily returns from orders for Sharpe/Volatility
    const dailyPnl = {};
    orders.forEach(o => {
      const day = new Date(o.executedAt || o.createdAt).toISOString().slice(0, 10);
      if (!dailyPnl[day]) dailyPnl[day] = 0;
      if (o.type === 'SELL') {
        dailyPnl[day] += o.price * o.quantity;
      } else {
        dailyPnl[day] -= o.price * o.quantity;
      }
    });

    const dailyReturns = Object.values(dailyPnl);
    const avgReturn = dailyReturns.length > 0
      ? dailyReturns.reduce((s, r) => s + r, 0) / dailyReturns.length
      : 0;

    const variance = dailyReturns.length > 1
      ? dailyReturns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / (dailyReturns.length - 1)
      : 0;
    const volatility = Math.sqrt(variance);
    const sharpeRatio = volatility > 0
      ? parseFloat(((avgReturn / volatility) * Math.sqrt(252)).toFixed(2))
      : 0;

    // ── Diversification Score (0-100) ──
    // Based on number of sectors and evenness of distribution (Herfindahl index)
    const hhi = sectorAllocation.reduce((s, sec) => s + Math.pow(sec.percent / 100, 2), 0);
    const diversificationScore = Math.round((1 - hhi) * 100);

    // ── Concentration Risk ──
    const topHolding = holdings.length > 0
      ? holdings.reduce((max, h) => {
        const val = (prices[h.stock] || h.avgPrice) * Math.abs(h.quantity);
        return val > max.value ? { stock: h.stock, value: val } : max;
      }, { stock: '', value: 0 })
      : { stock: 'N/A', value: 0 };

    const concentrationRisk = totalValue > 0
      ? parseFloat(((topHolding.value / totalValue) * 100).toFixed(1))
      : 0;

    // ── Beta (pseudo: correlation to market average) ──
    // Simple mock beta using sector weights
    const sectorBetas = {
      IT: 1.1, Banking: 1.3, Energy: 0.9, Telecom: 0.8,
      FMCG: 0.6, Infra: 1.2, Finance: 1.4, Auto: 1.1,
      Consumer: 0.7, Pharma: 0.5, Cement: 0.9, Other: 1.0,
    };
    const beta = sectorAllocation.reduce((s, sec) => {
      return s + (sectorBetas[sec.sector] || 1.0) * (sec.percent / 100);
    }, 0);

    res.json({
      success: true,
      analytics: {
        sectorAllocation,
        totalValue: parseFloat(totalValue.toFixed(2)),
        holdingsCount: holdings.length,
        riskMetrics: {
          sharpeRatio,
          volatility: parseFloat(volatility.toFixed(2)),
          beta: parseFloat(beta.toFixed(2)),
          diversificationScore,
          concentrationRisk,
          topHolding: topHolding.stock,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error computing analytics', error: error.message });
  }
};
