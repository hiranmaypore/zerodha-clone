const express = require('express');
const { getHoldings, getDashboard } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getHoldings);
router.get('/dashboard', protect, getDashboard);

module.exports = router;
