const express = require('express');
const { getHoldings, getPositions, getDashboard, downloadTaxStatement } = require('../controllers/portfolioController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getHoldings);
router.get('/positions', protect, getPositions);
router.get('/dashboard', protect, getDashboard);
router.get('/export', protect, downloadTaxStatement);

module.exports = router;
