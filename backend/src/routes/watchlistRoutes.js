const express = require('express');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlistController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getWatchlist);
router.post('/', protect, addToWatchlist);
router.delete('/:symbol', protect, removeFromWatchlist);

module.exports = router;
