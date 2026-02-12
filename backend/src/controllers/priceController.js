const { getHistoricalData } = require('../services/priceHistoryService');
const STOCKS = require('../config/stocks');

/**
 * Get historical price data for a stock
 * GET /api/prices/history/:symbol
 */
const getStockHistory = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { from, to, limit } = req.query;
    
    // Validate symbol
    const upperSymbol = symbol.toUpperCase();
    const stockExists = Array.isArray(STOCKS) && STOCKS.some(s => s.symbol === upperSymbol);
    
    if (!stockExists) {
      return res.status(400).json({ message: 'Invalid stock symbol' });
    }
    
    const limitNum = limit ? parseInt(limit) : 100;
    
    if (limitNum > 1000) {
      return res.status(400).json({ message: 'Limit cannot exceed 1000' });
    }
    
    const history = await getHistoricalData(upperSymbol, from, to, limitNum);
    
    res.json({
      success: true,
      symbol: upperSymbol,
      count: history.length,
      data: history.map(record => ({
        price: record.price,
        timestamp: record.timestamp,
        open: record.open,
        high: record.high,
        low: record.low,
        close: record.close
      }))
    });
    
  } catch (error) {
    console.error('Get Stock History Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get latest price for a stock
 * GET /api/prices/:symbol
 */
const getLatestPrice = async (req, res) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();
    
    const { getPrices } = require('../services/priceSimulator');
    const currentPrices = getPrices();
    
    const price = currentPrices[upperSymbol];
    
    if (!price) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    
    res.json({
      success: true,
      symbol: upperSymbol,
      price: price,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Get Latest Price Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getStockHistory,
  getLatestPrice
};
