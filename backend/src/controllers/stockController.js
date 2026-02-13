const STOCKS = require('../config/stocks');
const { getPrices } = require('../services/priceSimulator');

/**
 * Get all available stocks with current prices
 * GET /api/stocks
 */
exports.getAllStocks = async (req, res) => {
  try {
    const prices = getPrices();

    const stocks = STOCKS.map(stock => ({
      symbol: stock.symbol,
      name: stock.name,
      price: prices[stock.symbol] ? parseFloat(prices[stock.symbol].toFixed(2)) : null
    }));

    res.json({
      success: true,
      count: stocks.length,
      stocks
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
