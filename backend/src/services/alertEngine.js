const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');


// Handles checking alerts and sending WS notifications
const startAlertEngine = (io) => {
  const Alert = require('../models/Alert');
  const User = require('../models/User');

  logger.info('🔔 Alert Engine Started...');

  setInterval(async () => {
    try {
      const prices = getPrices();
      if (!prices) return;


      if (!global.dbConnected) {
        if (!global.inMemoryDB.alerts) return;
        
        for (const [id, alert] of global.inMemoryDB.alerts) {
          if (!alert.isActive) continue;
          
          const currentPrice = prices[alert.stock];
          if (!currentPrice) continue;

          let triggered = false;
          if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) triggered = true;
          if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) triggered = true;

          if (triggered) {
            alert.isActive = false;
            alert.triggeredAt = new Date().toISOString();
            
            // Send socket event
            if (io) {
              const message = `🔔 Alert triggered: ${alert.stock} crossed ${alert.condition === 'ABOVE' ? 'above' : 'below'} ₹${alert.targetPrice}`;
              io.to(alert.user).emit('notification', {
                id: Date.now(),
                title: 'Price Alert',
                message,
                type: 'info',
                read: false,
                timestamp: alert.triggeredAt
              });
            }
          }
        }
        return;
      }

      // DB Mode
      const activeAlerts = await Alert.find({ isActive: true });
      for (const alert of activeAlerts) {
        const currentPrice = prices[alert.stock];
        if (!currentPrice) continue;

        let triggered = false;
        if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) triggered = true;
        if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) triggered = true;

        if (triggered) {
          alert.isActive = false;
          alert.triggeredAt = new Date();
          await alert.save();

          if (io) {
            const message = `🔔 Alert triggered: ${alert.stock} crossed ${alert.condition === 'ABOVE' ? 'above' : 'below'} ₹${alert.targetPrice}`;
            io.to(alert.user.toString()).emit('notification', {
              id: alert._id,
              title: 'Price Alert',
              message,
              type: 'info',
              read: false,
              timestamp: alert.triggeredAt
            });
          }
        }
      }
    } catch (e) {
      logger.error(`Alert Engine Error: ${e.message}`);
    }
  }, 2000); // Check every 2 seconds
};

module.exports = { startAlertEngine };
