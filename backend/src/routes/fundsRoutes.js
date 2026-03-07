const express = require('express');
const { depositFunds, withdrawFunds, getBalance, getEquityCurve } = require('../controllers/fundsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getBalance);
router.get('/equity', protect, getEquityCurve);
router.post('/deposit', protect, depositFunds);
router.post('/withdraw', protect, withdrawFunds);

module.exports = router;
