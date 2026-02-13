const express = require('express');
const { getAllStocks } = require('../controllers/stockController');

const router = express.Router();

// Public - no auth needed
router.get('/', getAllStocks);

module.exports = router;
