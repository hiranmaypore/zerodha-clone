const express = require('express');
const { buyStock, sellStock, getOrders, cancelOrder } = require('../controllers/orderController');
const { placeStopLoss, placeBracketOrder } = require('../controllers/advancedOrderController');
const { protect } = require('../middleware/authMiddleware'); // Authentication check

const router = express.Router();

router.post('/buy', protect, buyStock);
router.post('/sell', protect, sellStock);
router.get('/', protect, getOrders);
router.delete('/:orderId', protect, cancelOrder);
// Advanced Orders
router.post('/stop-loss', protect, placeStopLoss);
router.post('/bracket', protect, placeBracketOrder);
// router.get('/:id', protect, getOrderById);

module.exports = router;
