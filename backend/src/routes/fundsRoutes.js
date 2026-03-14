const express = require('express');
const { depositFunds, withdrawFunds, getBalance, getEquityCurve } = require('../controllers/fundsController');
const { protect } = require('../middleware/authMiddleware');
const { validate, fundsSchema } = require('../middleware/validator');

const router = express.Router();

router.get('/', protect, getBalance);
router.get('/equity', protect, getEquityCurve);
router.post('/deposit', protect, validate(fundsSchema), depositFunds);
router.post('/withdraw', protect, validate(fundsSchema), withdrawFunds);

module.exports = router;
