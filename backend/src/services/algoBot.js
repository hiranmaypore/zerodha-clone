const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');

let botInterval = null;

// O(1) Memory State Tracker for all stocks
const emaState = {};
const FAST_PERIOD = 9;
const SLOW_PERIOD = 21;

const calculateEMA = (currentPrice, previousEma, period) => {
  if (previousEma === null) return currentPrice; // Initialize with first price
  const alpha = 2 / (period + 1);
  return (currentPrice * alpha) + (previousEma * (1 - alpha));
};

const startAlgoBot = (io) => {
  if (botInterval) return;
  logger.info('🤖 Quantitative AlgoBot Started: Using EMA Crossover Strategy (9/21)');
  
  // Run high-frequency analysis every 3 seconds to catch the 1-second ticks
  botInterval = setInterval(() => {
    try {
      const prices = getPrices();
      if (!prices || Object.keys(prices).length === 0) return;
      
      for (const [symbol, currentPrice] of Object.entries(prices)) {
        // Initialize state for new symbols
        if (!emaState[symbol]) {
          emaState[symbol] = {
            fastEma: null,
            slowEma: null,
            currentTrend: null // 'BULLISH' | 'BEARISH'
          };
        }

        const state = emaState[symbol];

        // Calculate new EMAs
        state.fastEma = calculateEMA(currentPrice, state.fastEma, FAST_PERIOD);
        state.slowEma = calculateEMA(currentPrice, state.slowEma, SLOW_PERIOD);

        // Detect Crossovers
        let newTrend = state.currentTrend;
        
        if (state.fastEma > state.slowEma) {
          newTrend = 'BULLISH';
        } else if (state.fastEma < state.slowEma) {
          newTrend = 'BEARISH';
        }

        // Trigger signal ONLY on the exact crossover moment
        if (state.currentTrend !== null && newTrend !== state.currentTrend) {
          if (newTrend === 'BULLISH') {
            const msg = `Fast EMA crossed ABOVE Slow EMA at ₹${currentPrice.toFixed(2)}. Generating BUY Signal!`;
            logger.info(`📈 AlgoBot [${symbol}]: ${msg}`);
            if (io) io.emit('algo_signal', { symbol, trend: 'BULLISH', price: currentPrice, message: msg });
          } else if (newTrend === 'BEARISH') {
            const msg = `Fast EMA crossed BELOW Slow EMA at ₹${currentPrice.toFixed(2)}. Generating SELL Signal!`;
            logger.warn(`📉 AlgoBot [${symbol}]: ${msg}`);
            if (io) io.emit('algo_signal', { symbol, trend: 'BEARISH', price: currentPrice, message: msg });
          }
        }

        // Save new state
        state.currentTrend = newTrend;
      }
      
    } catch (e) {
      logger.error(`AlgoBot Error: ${e.message}`);
    }
  }, 3000);
};

const stopAlgoBot = () => {
  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
    logger.info('🛑 AlgoBot Service Stopped.');
  }
};

module.exports = { startAlgoBot, stopAlgoBot };

