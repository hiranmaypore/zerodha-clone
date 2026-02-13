const express = require('express');
const { depositFunds, withdrawFunds, getBalance } = require('../controllers/fundsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getBalance);
router.post('/deposit', protect, depositFunds);
router.post('/withdraw', protect, withdrawFunds);

module.exports = router;
