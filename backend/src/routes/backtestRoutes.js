const express = require('express');
const { runBacktest } = require('../controllers/backtestController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/run', protect, runBacktest);

module.exports = router;
