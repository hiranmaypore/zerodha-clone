const User = require('../models/User');
const Holding = require('../models/Holding');
const Order = require('../models/Order');
const { getPrices } = require('../services/priceSimulator');

exports.getLeaderboard = async (req, res) => {
  const prices = getPrices();

  try {
    let users = [];
    if (!global.dbConnected) {
      // Memory Mode
      users = Array.from(global.inMemoryDB.users.values()).map(u => ({
        _id: u._id,
        name: u.name,
        balance: u.balance,
      }));
    } else {
      // DB Mode
      users = await User.find().select('name balance').lean();
    }

    const leaderboard = await Promise.all(users.map(async (u) => {
      let holdings = [];
      let orders = [];

      if (!global.dbConnected) {
        const userIdStr = u._id.toString();
        holdings = Array.from(global.inMemoryDB.holdings.values())
          .filter(h => h.user.toString() === userIdStr);
        orders = Array.from(global.inMemoryDB.orders.values())
          .filter(o => o.user.toString() === userIdStr && o.status === 'COMPLETED');
      } else {
        holdings = await Holding.find({ user: u._id });
        orders = await Order.find({ user: u._id, status: 'COMPLETED' });
      }

      const holdingsValue = holdings.reduce((sum, h) => {
        const cur = prices[h.stock] || h.avgPrice || 0;
        return sum + cur * Math.abs(h.quantity);
      }, 0);

      const netWorth = u.balance + holdingsValue;
      const roi = ((netWorth - 100000) / 100000) * 100;

      // Badges logic
      const badges = [];
      if (roi >= 50) badges.push('The Wizard');
      else if (roi >= 10) badges.push('Consistent Gainer');

      if (orders.length >= 50) badges.push('Scalping Specialist');
      else if (orders.length >= 20) badges.push('Active Trader');

      if (netWorth >= 200000) badges.push('Whale');

      return {
        name: u.name,
        netWorth: parseFloat(netWorth.toFixed(2)),
        roi: parseFloat(roi.toFixed(2)),
        tradeCount: orders.length,
        badges
      };
    }));

    // Sort by ROI descending
    leaderboard.sort((a, b) => b.roi - a.roi);

    res.json({ success: true, leaderboard: leaderboard.slice(0, 50) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard', error: error.message });
  }
};
