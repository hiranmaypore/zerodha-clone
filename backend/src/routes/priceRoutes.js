const express = require('express');
const { getStockHistory, getLatestPrice } = require('../controllers/priceController');

const router = express.Router();

/**
 * IMPORTANT: Express matches routes top-to-bottom.
 * /history/:symbol MUST be declared before /:symbol,
 * otherwise "history" would be captured as the :symbol param.
 */
router.get('/history/:symbol', getStockHistory);  // GET /api/prices/history/TCS?period=1d
router.get('/:symbol', getLatestPrice);            // GET /api/prices/TCS

module.exports = router;
