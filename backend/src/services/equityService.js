const User = require('../models/User');
const Holding = require('../models/Holding');
const NetWorth = require('../models/NetWorth');
const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');

const snapshotEquity = async () => {
  try {
    const prices = getPrices();
    if (!prices) return;

    const users = await User.find({});
    for (const user of users) {
      const holdings = await Holding.find({ user: user._id });
      let holdingsValue = 0;
      
      for (const h of holdings) {
        const currentPrice = prices[h.stock] || h.avgPrice;
        holdingsValue += currentPrice * h.quantity;
      }

      const totalNetWorth = (user.balance || 0) + holdingsValue;

      // 1. Save snapshot
      await NetWorth.create({
        userId: user._id,
        netWorth: totalNetWorth,
        cash: user.balance,
        holdingsValue: holdingsValue,
        timestamp: new Date()
      });

      // 2. Keep only last 100 snapshots to prevent DB bloat in demo
      const count = await NetWorth.countDocuments({ userId: user._id });
      if (count > 100) {
        const oldest = await NetWorth.findOne({ userId: user._id }).sort({ timestamp: 1 });
        if (oldest) await NetWorth.deleteOne({ _id: oldest._id });
      }
    }
    // logger.debug('💹 Net worth snapshots taken for all users');
  } catch (error) {
    logger.error('Failed to take equity snapshots:', error);
  }
};

const startEquityService = () => {
  // Take a snapshot every 1 hour (for demo purposes we can make it faster)
  // Let's do every 5 minutes so users see progress faster
  setInterval(snapshotEquity, 5 * 60 * 1000);
  
  // Also take an initial one
  setTimeout(snapshotEquity, 10000);
};

module.exports = startEquityService;
