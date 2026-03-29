const Watchlist = require('../models/Watchlist');
const STOCKS = require('../config/stocks');
const { getPrices } = require('../services/priceSimulator');

// In-memory watchlist store keyed by userId
const memWatchlists = {};

const getWatchlist = async (req, res) => {
  const userId = (req.user._id || req.user.id).toString();
  const currentPrices = getPrices();

  if (!global.dbConnected) {
    const stocks = memWatchlists[userId] || ['RELIANCE', 'TCS', 'INFY', 'HDFC'];
    const enriched = stocks.map(symbol => {
      const stockInfo = STOCKS.find(s => s.symbol === symbol);
      return { symbol, name: stockInfo?.name || symbol, currentPrice: currentPrices[symbol] || null };
    });
    return res.json({ success: true, watchlist: enriched });
  }

  try {
    let watchlist = await Watchlist.findOne({ userId });
    if (!watchlist) watchlist = await Watchlist.create({ userId, stocks: [] });
    const enriched = watchlist.stocks.map(item => {
      const stockInfo = STOCKS.find(s => s.symbol === item.symbol);
      return { symbol: item.symbol, name: stockInfo?.name || item.symbol, currentPrice: currentPrices[item.symbol] || null, addedAt: item.addedAt };
    });
    res.json({ success: true, watchlist: enriched });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const addToWatchlist = async (req, res) => {
  const { symbol } = req.body;
  const userId = (req.user._id || req.user.id).toString();
  if (!symbol) return res.status(400).json({ message: 'Symbol required' });
  const upperSymbol = symbol.toUpperCase();
  const stockExists = STOCKS.some(s => s.symbol === upperSymbol);
  if (!stockExists) return res.status(400).json({ message: 'Invalid stock symbol' });

  if (!global.dbConnected) {
    if (!memWatchlists[userId]) memWatchlists[userId] = ['RELIANCE', 'TCS', 'INFY', 'HDFC'];
    if (!memWatchlists[userId].includes(upperSymbol)) {
      memWatchlists[userId].push(upperSymbol);
    }
    return res.json({ success: true, message: 'Added to watchlist', stock: upperSymbol });
  }

  try {
    let watchlist = await Watchlist.findOne({ userId });
    if (!watchlist) {
      watchlist = await Watchlist.create({ userId, stocks: [{ symbol: upperSymbol }] });
    } else {
      if (watchlist.stocks.some(s => s.symbol === upperSymbol))
        return res.status(400).json({ message: 'Already in watchlist' });
      if (watchlist.stocks.length >= 50)
        return res.status(400).json({ message: 'Watchlist limit reached' });
      watchlist.stocks.push({ symbol: upperSymbol });
      await watchlist.save();
    }
    res.json({ success: true, message: 'Stock added to watchlist', stock: upperSymbol });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const removeFromWatchlist = async (req, res) => {
  const { symbol } = req.params;
  const userId = (req.user._id || req.user.id).toString();

  if (!global.dbConnected) {
    if (memWatchlists[userId]) {
      memWatchlists[userId] = memWatchlists[userId].filter(s => s !== symbol.toUpperCase());
    }
    return res.json({ success: true, message: 'Removed from watchlist', stock: symbol.toUpperCase() });
  }

  try {
    const watchlist = await Watchlist.findOne({ userId });
    if (!watchlist) return res.status(404).json({ message: 'Watchlist not found' });
    watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol.toUpperCase());
    await watchlist.save();
    res.json({ success: true, message: 'Stock removed from watchlist', stock: symbol.toUpperCase() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
