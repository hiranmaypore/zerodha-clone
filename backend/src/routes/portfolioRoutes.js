const express = require('express');
const { getHoldings, getPositions, getDashboard, downloadTaxStatement } = require('../controllers/portfolioController');
const { getLeaderboard } = require('../controllers/leaderboardController');
const { getTradeJournal } = require('../controllers/journalController');
const { getPortfolioAnalytics } = require('../controllers/analyticsController');
const { getMarketNews } = require('../controllers/newsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getHoldings);
router.get('/positions', protect, getPositions);
router.get('/dashboard', protect, getDashboard);
router.get('/leaderboard', protect, getLeaderboard);
router.get('/journal', protect, getTradeJournal);
router.get('/export', protect, downloadTaxStatement);
router.get('/analytics', protect, getPortfolioAnalytics);
router.get('/news', protect, getMarketNews);

module.exports = router;
