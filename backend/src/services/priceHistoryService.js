const { getPrices } = require('./priceSimulator');

// In-memory price history (used when DB is unavailable)
const memHistory = {}; // symbol -> [{price, timestamp}]
const MAX_MEM_RECORDS = 200;

let historyInterval = null;

const startPriceHistoryService = () => {
  console.log('📊 Price History Service Started (in-memory mode)...');
  capturePriceSnapshot();
  historyInterval = setInterval(capturePriceSnapshot, 60000);
};

const capturePriceSnapshot = async () => {
  try {
    const currentPrices = getPrices();
    const timestamp = new Date();

    if (!global.dbConnected) {
      // Store in memory
      for (const [symbol, price] of Object.entries(currentPrices)) {
        if (!memHistory[symbol]) memHistory[symbol] = [];
        memHistory[symbol].push({ symbol, price, close: price, open: price, high: price, low: price, timestamp });
        if (memHistory[symbol].length > MAX_MEM_RECORDS) {
          memHistory[symbol].shift();
        }
      }
      return;
    }

    const PriceHistory = require('../models/PriceHistory');
    const priceRecords = [];
    for (const [symbol, price] of Object.entries(currentPrices)) {
      priceRecords.push({ symbol, price, close: price, timestamp });
    }
    if (priceRecords.length > 0) {
      await PriceHistory.insertMany(priceRecords);
    }
  } catch (error) {
    // Silently capture to memory on error
    const currentPrices = getPrices();
    const timestamp = new Date();
    for (const [symbol, price] of Object.entries(currentPrices)) {
      if (!memHistory[symbol]) memHistory[symbol] = [];
      memHistory[symbol].push({ symbol, price, close: price, open: price, high: price, low: price, timestamp });
      if (memHistory[symbol].length > MAX_MEM_RECORDS) memHistory[symbol].shift();
    }
  }
};

const getHistoricalData = async (symbol, fromDate, toDate, limit = 100) => {
  if (!global.dbConnected) {
    const data = (memHistory[symbol] || []).slice(-limit);
    return fromDate || toDate ? data.filter(d => {
      const t = new Date(d.timestamp);
      if (fromDate && t < new Date(fromDate)) return false;
      if (toDate && t > new Date(toDate)) return false;
      return true;
    }) : data;
  }
  try {
    const PriceHistory = require('../models/PriceHistory');
    const query = { symbol };
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = new Date(fromDate);
      if (toDate) query.timestamp.$lte = new Date(toDate);
    }
    const history = await PriceHistory.find(query).sort({ timestamp: -1 }).limit(limit).lean();
    return history.reverse();
  } catch (error) {
    return memHistory[symbol] || [];
  }
};

const getMemHistory = () => memHistory;

const stopPriceHistoryService = () => {
  if (historyInterval) clearInterval(historyInterval);
};

module.exports = { startPriceHistoryService, stopPriceHistoryService, getHistoricalData, getMemHistory, capturePriceSnapshot };
