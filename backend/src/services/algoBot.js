const { getPrices } = require('./priceSimulator');
const logger = require('../utils/logger');

let botInterval = null;

// O(1) Memory State Tracker for all stocks
const botState = {};
const FAST_PERIOD = 9;
const SLOW_PERIOD = 21;
const RSI_PERIOD = 14;

const calculateEMA = (currentPrice, previousEma, period) => {
  if (previousEma === null || previousEma === undefined) return currentPrice;
  const alpha = 2 / (period + 1);
  return (currentPrice * alpha) + (previousEma * (1 - alpha));
};

const calculateRSI = (currentPrice, state) => {
  if (!state.prevPrice) {
    state.prevPrice = currentPrice;
    return null;
  }

  const diff = currentPrice - state.prevPrice;
  state.prevPrice = currentPrice;

  const gain = Math.max(0, diff);
  const loss = Math.max(0, -diff);

  // Smooth Average Gain/Loss (Wilder's Smoothing)
  if (state.avgGain === null || state.avgGain === undefined) {
    state.avgGain = gain;
    state.avgLoss = loss;
    return null;
  }

  state.avgGain = (state.avgGain * (RSI_PERIOD - 1) + gain) / RSI_PERIOD;
  state.avgLoss = (state.avgLoss * (RSI_PERIOD - 1) + loss) / RSI_PERIOD;

  if (state.avgLoss === 0) return 100;
  const rs = state.avgGain / state.avgLoss;
  return 100 - (100 / (1 + rs));
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
        if (!botState[symbol]) {
          botState[symbol] = {
            ema: { fast: null, slow: null, trend: null },
            rsi: { avgGain: null, avgLoss: null, prevPrice: null, trend: null }
          };
        }

        const state = botState[symbol];

        // 1. EMA Strategy
        const prevEmaTrend = state.ema.trend;
        state.ema.fast = calculateEMA(currentPrice, state.ema.fast, FAST_PERIOD);
        state.ema.slow = calculateEMA(currentPrice, state.ema.slow, SLOW_PERIOD);
        
        state.ema.trend = state.ema.fast > state.ema.slow ? 'BULLISH' : 'BEARISH';

        if (prevEmaTrend && state.ema.trend !== prevEmaTrend) {
          const type = state.ema.trend === 'BULLISH' ? 'BUY' : 'SELL';
          const msg = `EMA Crossover (9/21): Fast EMA crossed ${state.ema.trend === 'BULLISH' ? 'ABOVE' : 'BELOW'} Slow EMA.`;
          if (io) io.emit('algo_signal', { symbol, trend: state.ema.trend, price: currentPrice, message: msg, strategy: 'EMA' });
          logger.info(`🤖 [${symbol}] EMA Signal: ${type} at ₹${currentPrice}`);
        }

        // 2. RSI Strategy
        const rsiVal = calculateRSI(currentPrice, state.rsi);
        if (rsiVal !== null) {
          let rsiTrend = null;
          if (rsiVal < 30) rsiTrend = 'BULLISH'; // Oversold -> Potential Buy
          else if (rsiVal > 70) rsiTrend = 'BEARISH'; // Overbought -> Potential Sell
          
          if (rsiTrend && state.rsi.trend !== rsiTrend) {
            const type = rsiTrend === 'BULLISH' ? 'BUY' : 'SELL';
            const msg = `RSI Strategy: Market is ${rsiTrend === 'BULLISH' ? 'Oversold' : 'Overbought'} (RSI: ${rsiVal.toFixed(1)}).`;
            if (io) io.emit('algo_signal', { symbol, trend: rsiTrend, price: currentPrice, message: msg, strategy: 'RSI' });
            logger.info(`🤖 [${symbol}] RSI Signal: ${type} at ₹${currentPrice}`);
          }
          state.rsi.trend = rsiTrend;
        }
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

