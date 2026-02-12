const express = require('express');
const { getStockHistory, getLatestPrice } = require('../controllers/priceController');

const router = express.Router();

// Public endpoints - no auth required for price data
router.get('/history/:symbol', getStockHistory);
router.get('/:symbol', getLatestPrice);

module.exports = router;
