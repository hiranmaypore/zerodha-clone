let io = null;

const initializeNotifications = (socketIo) => {
  io = socketIo;
};

const notifyOrderExecuted = async (order) => {
  try {
    if (!io) return;
    const userId = order.user?.toString?.() || order.user;
    io.to(userId).emit('order_executed', {
      orderId: order._id,
      stock: order.stock,
      type: order.type,
      quantity: order.quantity,
      price: order.price,
      status: 'COMPLETED',
    });
  } catch (e) { /* silent */ }
};

const notifyOrderCancelled = async (order) => {
  try {
    if (!io) return;
    const userId = order.user?.toString?.() || order.user;
    io.to(userId).emit('order_cancelled', {
      orderId: order._id,
      stock: order.stock,
    });
  } catch (e) { /* silent */ }
};

const notifyStopLossTriggered = async (order, price) => {
  try {
    if (!io) return;
    const userId = order.user?.toString?.() || order.user;
    io.to(userId).emit('stop_loss_triggered', { orderId: order._id, stock: order.stock, price });
  } catch (e) { /* silent */ }
};

const notifyBracketEntry = async (order, price) => {
  try {
    if (!io) return;
    const userId = order.user?.toString?.() || order.user;
    io.to(userId).emit('bracket_entry', { orderId: order._id, stock: order.stock, price });
  } catch (e) { /* silent */ }
};

module.exports = { initializeNotifications, notifyOrderExecuted, notifyOrderCancelled, notifyStopLossTriggered, notifyBracketEntry };
