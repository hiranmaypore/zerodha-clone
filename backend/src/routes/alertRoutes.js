const express = require('express');
const { createAlert, getAlerts, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createAlert);
router.get('/', protect, getAlerts);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
