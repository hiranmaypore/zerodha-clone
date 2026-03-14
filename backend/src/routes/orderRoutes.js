const express = require('express');
const { buyStock, sellStock, getOrders, cancelOrder } = require('../controllers/orderController');
const { placeStopLoss, placeBracketOrder } = require('../controllers/advancedOrderController');
const { protect } = require('../middleware/authMiddleware');
const { validate, orderSchema } = require('../middleware/validator');

const router = express.Router();

router.post('/buy', protect, validate(orderSchema), buyStock);
router.post('/sell', protect, validate(orderSchema), sellStock);
router.get('/', protect, getOrders);
router.delete('/:orderId', protect, cancelOrder);
// Advanced Orders
router.post('/stop-loss', protect, placeStopLoss);
router.post('/bracket', protect, placeBracketOrder);

module.exports = router;
