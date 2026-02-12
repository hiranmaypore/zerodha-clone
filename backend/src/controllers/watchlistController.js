const Watchlist = require('../models/Watchlist');
const STOCKS = require('../config/stocks');
const { getPrices } = require('../services/priceSimulator');

/**
 * Get user's watchlist
 * GET /api/watchlist
 */
const getWatchlist = async (req, res) => {
  try {
    const userId = req.user._id;
    
    let watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      // Create empty watchlist if doesn't exist
      watchlist = await Watchlist.create({ userId, stocks: [] });
    }
    
    // Enrich with current prices and stock names
    const currentPrices = getPrices();
    const enrichedStocks = watchlist.stocks.map(item => {
      const stockInfo = STOCKS.find(s => s.symbol === item.symbol);
      return {
        symbol: item.symbol,
        name: stockInfo ? stockInfo.name : item.symbol,
        currentPrice: currentPrices[item.symbol] || null,
        addedAt: item.addedAt
      };
    });
    
    res.json({
      success: true,
      watchlist: enrichedStocks
    });
    
  } catch (error) {
    console.error('Get Watchlist Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Add stock to watchlist
 * POST /api/watchlist
 */
const addToWatchlist = async (req, res) => {
  try {
    const { symbol } = req.body;
    const userId = req.user._id;
    
    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }
    
    // Validate stock exists
    const upperSymbol = symbol.toUpperCase();
    const stockExists = Array.isArray(STOCKS) && STOCKS.some(s => s.symbol === upperSymbol);
    
    if (!stockExists) {
      return res.status(400).json({ message: 'Invalid stock symbol' });
    }
    
    let watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      watchlist = await Watchlist.create({ 
        userId, 
        stocks: [{ symbol: upperSymbol }] 
      });
    } else {
      // Check if already in watchlist
      const alreadyExists = watchlist.stocks.some(s => s.symbol === upperSymbol);
      if (alreadyExists) {
        return res.status(400).json({ message: 'Stock already in watchlist' });
      }
      
      // Check limit
      if (watchlist.stocks.length >= 50) {
        return res.status(400).json({ message: 'Watchlist limit reached (max 50 stocks)' });
      }
      
      watchlist.stocks.push({ symbol: upperSymbol });
      await watchlist.save();
    }
    
    res.json({
      success: true,
      message: 'Stock added to watchlist',
      stock: upperSymbol
    });
    
  } catch (error) {
    console.error('Add to Watchlist Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Remove stock from watchlist
 * DELETE /api/watchlist/:symbol
 */
const removeFromWatchlist = async (req, res) => {
  try {
    const { symbol } = req.params;
    const userId = req.user._id;
    
    const watchlist = await Watchlist.findOne({ userId });
    
    if (!watchlist) {
      return res.status(404).json({ message: 'Watchlist not found' });
    }
    
    const initialLength = watchlist.stocks.length;
    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol.toUpperCase());
    
    if (watchlist.stocks.length === initialLength) {
      return res.status(404).json({ message: 'Stock not found in watchlist' });
    }
    
    await watchlist.save();
    
    res.json({
      success: true,
      message: 'Stock removed from watchlist',
      stock: symbol.toUpperCase()
    });
    
  } catch (error) {
    console.error('Remove from Watchlist Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
