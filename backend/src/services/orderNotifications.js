/**
 * Order Notifications via WebSocket
 * Emits real-time events for order updates
 */

let io = null;

const initializeNotifications = (socketIo) => {
  io = socketIo;
  console.log('🔔 Order Notifications Service Initialized');
};

/**
 * Emit order executed notification
 */
const notifyOrderExecuted = async (order) => {
  if (!io) return;
  
  const userId = order.user.toString();
  
  io.to(userId).emit('order_executed', {
    orderId: order._id,
    stock: order.stock,
    type: order.type,
    quantity: order.quantity,
    price: order.price,
    orderCategory: order.orderCategory,
    timestamp: new Date()
  });
  
  console.log(`📢 Notified user ${userId}: Order ${order._id} executed`);
};

/**
 * Emit order cancelled notification
 */
const notifyOrderCancelled = async (order) => {
  if (!io) return;
  
  const userId = order.user.toString();
  
  io.to(userId).emit('order_cancelled', {
    orderId: order._id,
    stock: order.stock,
    type: order.type,
    quantity: order.quantity,
    cancelReason: order.cancelReason,
    timestamp: new Date()
  });
  
  console.log(`📢 Notified user ${userId}: Order ${order._id} cancelled`);
};

/**
 * Emit stop-loss triggered notification
 */
const notifyStopLossTriggered = async (order, currentPrice) => {
  if (!io) return;
  
  const userId = order.user.toString();
  
  io.to(userId).emit('stop_loss_triggered', {
    orderId: order._id,
    stock: order.stock,
    quantity: order.quantity,
    triggerPrice: order.stopLossPrice,
    executedPrice: currentPrice,
    timestamp: new Date()
  });
  
  console.log(`⚠️  Notified user ${userId}: Stop-Loss triggered for ${order.stock}`);
};

/**
 * Emit bracket order entry notification
 */
const notifyBracketEntry = async (order, currentPrice) => {
  if (!io) return;
  
  const userId = order.user.toString();
  
  io.to(userId).emit('bracket_entry_executed', {
    orderId: order._id,
    stock: order.stock,
    quantity: order.quantity,
    entryPrice: currentPrice,
    targetPrice: order.targetPrice,
    stopLossPrice: order.stopLossPrice,
    timestamp: new Date()
  });
  
  console.log(`📊 Notified user ${userId}: Bracket entry for ${order.stock}`);
};

module.exports = {
  initializeNotifications,
  notifyOrderExecuted,
  notifyOrderCancelled,
  notifyStopLossTriggered,
  notifyBracketEntry
};
