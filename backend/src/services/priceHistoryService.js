const PriceHistory = require('../models/PriceHistory');
const { getPrices } = require('./priceSimulator');

let historyInterval = null;

/**
 * Start capturing price history
 * Stores current prices every minute
 */
const startPriceHistoryService = () => {
  console.log('📊 Price History Service Started...');
  
  // Store initial prices immediately
  capturePriceSnapshot();
  
  // Then capture every 1 minute
  historyInterval = setInterval(() => {
    capturePriceSnapshot();
  }, 60000); // 60 seconds
};

/**
 * Capture current price snapshot for all stocks
 */
const capturePriceSnapshot = async () => {
  try {
    const currentPrices = getPrices();
    const timestamp = new Date();
    
    const priceRecords = [];
    
    for (const [symbol, price] of Object.entries(currentPrices)) {
      priceRecords.push({
        symbol,
        price,
        close: price,
        timestamp
      });
    }
    
    // Bulk insert for efficiency
    if (priceRecords.length > 0) {
      await PriceHistory.insertMany(priceRecords);
      console.log(`💾 Captured prices for ${priceRecords.length} stocks at ${timestamp.toLocaleTimeString()}`);
    }
    
  } catch (error) {
    console.error('❌ Price History Capture Error:', error.message);
  }
};

/**
 * Stop the price history service
 */
const stopPriceHistoryService = () => {
  if (historyInterval) {
    clearInterval(historyInterval);
    console.log('Price History Service Stopped');
  }
};

/**
 * Get historical data for a symbol
 */
const getHistoricalData = async (symbol, fromDate, toDate, limit = 100) => {
  try {
    const query = { symbol };
    
    if (fromDate || toDate) {
      query.timestamp = {};
      if (fromDate) query.timestamp.$gte = new Date(fromDate);
      if (toDate) query.timestamp.$lte = new Date(toDate);
    }
    
    const history = await PriceHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    return history.reverse(); // Return chronological order
    
  } catch (error) {
    throw new Error(`Failed to fetch historical data: ${error.message}`);
  }
};

/**
 * Clean up old price data
 * Keep only last 30 days of 1-minute data
 */
const cleanupOldData = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await PriceHistory.deleteMany({
      timestamp: { $lt: thirtyDaysAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old price records`);
    }
    
  } catch (error) {
    console.error('Cleanup Error:', error.message);
  }
};

// Run cleanup daily
setInterval(cleanupOldData, 24 * 60 * 60 * 1000); // 24 hours

module.exports = {
  startPriceHistoryService,
  stopPriceHistoryService,
  getHistoricalData,
  capturePriceSnapshot,
  cleanupOldData
};
