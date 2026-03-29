const express = require('express');
const { getAllStocks } = require('../controllers/stockController');
const { getSentiment } = require('../controllers/sentimentController');
const { getPrices, getOpeningPrices } = require('../services/priceSimulator');
const STOCKS = require('../config/stocks');

const router = express.Router();

// Public - no auth needed
router.get('/', getAllStocks);
router.get('/:symbol/sentiment', getSentiment);

// Stock detail with fundamentals
router.get('/:symbol/detail', (req, res) => {
  const { symbol } = req.params;
  const stock = STOCKS.find(s => s.symbol === symbol.toUpperCase());
  if (!stock) return res.status(404).json({ message: 'Stock not found' });

  const prices = getPrices();
  const opens = getOpeningPrices();
  const currentPrice = prices[stock.symbol] || 0;
  const openPrice = opens[stock.symbol] || currentPrice;
  const change = currentPrice - openPrice;
  const changePct = openPrice > 0 ? (change / openPrice) * 100 : 0;

  // Simulated fundamentals (realistic ranges per sector)
  const sectorFundamentals = {
    IT: { pe: 28 + Math.random() * 15, marketCap: 800000 + Math.random() * 1200000, divYield: 1.0 + Math.random() * 2, beta: 0.9 + Math.random() * 0.4 },
    Banking: { pe: 12 + Math.random() * 10, marketCap: 500000 + Math.random() * 800000, divYield: 0.8 + Math.random() * 1.5, beta: 1.1 + Math.random() * 0.4 },
    Energy: { pe: 10 + Math.random() * 12, marketCap: 1500000 + Math.random() * 500000, divYield: 0.5 + Math.random() * 1, beta: 0.8 + Math.random() * 0.3 },
    Telecom: { pe: 40 + Math.random() * 30, marketCap: 600000 + Math.random() * 400000, divYield: 0.2 + Math.random() * 0.5, beta: 0.7 + Math.random() * 0.3 },
    FMCG: { pe: 24 + Math.random() * 12, marketCap: 400000 + Math.random() * 300000, divYield: 2.5 + Math.random() * 2, beta: 0.5 + Math.random() * 0.2 },
    Auto: { pe: 18 + Math.random() * 15, marketCap: 200000 + Math.random() * 400000, divYield: 0.8 + Math.random() * 1, beta: 1.0 + Math.random() * 0.3 },
    Pharma: { pe: 22 + Math.random() * 18, marketCap: 150000 + Math.random() * 300000, divYield: 0.5 + Math.random() * 1, beta: 0.6 + Math.random() * 0.3 },
    Consumer: { pe: 60 + Math.random() * 30, marketCap: 200000 + Math.random() * 200000, divYield: 0.3 + Math.random() * 0.5, beta: 0.7 + Math.random() * 0.2 },
    Finance: { pe: 25 + Math.random() * 15, marketCap: 400000 + Math.random() * 300000, divYield: 0.1 + Math.random() * 0.5, beta: 1.3 + Math.random() * 0.3 },
    Infra: { pe: 20 + Math.random() * 10, marketCap: 350000 + Math.random() * 200000, divYield: 1.0 + Math.random() * 1, beta: 1.1 + Math.random() * 0.3 },
    Cement: { pe: 30 + Math.random() * 15, marketCap: 150000 + Math.random() * 200000, divYield: 0.5 + Math.random() * 0.8, beta: 0.9 + Math.random() * 0.2 },
  };

  const fund = sectorFundamentals[stock.sector] || sectorFundamentals.IT;
  const high52w = currentPrice * (1 + 0.1 + Math.random() * 0.3);
  const low52w = currentPrice * (1 - 0.1 - Math.random() * 0.25);

  res.json({
    success: true,
    stock: {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price: parseFloat(currentPrice.toFixed(2)),
      openPrice: parseFloat(openPrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePct: parseFloat(changePct.toFixed(2)),
      fundamentals: {
        pe: parseFloat(fund.pe.toFixed(1)),
        marketCap: parseFloat((fund.marketCap).toFixed(0)),
        divYield: parseFloat(fund.divYield.toFixed(2)),
        beta: parseFloat(fund.beta.toFixed(2)),
        high52w: parseFloat(high52w.toFixed(2)),
        low52w: parseFloat(low52w.toFixed(2)),
        eps: parseFloat((currentPrice / fund.pe).toFixed(2)),
        pbRatio: parseFloat((1.5 + Math.random() * 4).toFixed(2)),
        debtToEquity: parseFloat((0.1 + Math.random() * 1.5).toFixed(2)),
        roe: parseFloat((8 + Math.random() * 25).toFixed(1)),
      },
    },
  });
});

module.exports = router;
