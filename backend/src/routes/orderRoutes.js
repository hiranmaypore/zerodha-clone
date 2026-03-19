const express = require('express');
const { buyStock, sellStock, getOrders, cancelOrder, getSocialFeed } = require('../controllers/orderController');
const { placeStopLoss, placeBracketOrder } = require('../controllers/advancedOrderController');
const { protect } = require('../middleware/authMiddleware');
const { orderSchema } = require('../middleware/validator');

const router = express.Router();

// Social Feed (Must be before /:orderId to prevent ID overlap)
router.get('/feed', protect, getSocialFeed);

router.post('/buy', protect, orderSchema, buyStock);
router.post('/sell', protect, orderSchema, sellStock);
router.get('/', protect, getOrders);
router.delete('/:orderId', protect, cancelOrder);
// Advanced Orders
router.post('/stop-loss', protect, placeStopLoss);
router.post('/bracket', protect, placeBracketOrder);

module.exports = router;
