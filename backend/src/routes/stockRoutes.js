const express = require('express');
const { getAllStocks } = require('../controllers/stockController');
const { getSentiment } = require('../controllers/sentimentController');

const router = express.Router();

// Public - no auth needed
router.get('/', getAllStocks);
router.get('/:symbol/sentiment', getSentiment);

module.exports = router;
