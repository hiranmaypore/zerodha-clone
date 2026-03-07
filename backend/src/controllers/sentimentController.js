const { getHistoricalData } = require('../services/priceHistoryService');
const logger = require('../utils/logger');

// Calculate Simple Moving Average
const calculateSMA = (data, period) => {
  if (data.length < period) return null;
  const sum = data.slice(-period).reduce((acc, val) => acc + val, 0);
  return sum / period;
};

// Calculate Exponential Moving Average
const calculateEMA = (data, period) => {
  if (data.length < period) return null;
  const k = 2 / (period + 1);
  let ema = data[0]; // Start with first close roughly
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] * k) + (ema * (1 - k));
  }
  return ema;
};

// Calculate Relative Strength Index (RSI)
const calculateRSI = (data, period = 14) => {
  if (data.length <= period) return 50; // Default Neutral

  let gains = 0;
  let losses = 0;

  // Initial calculation
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed calculation
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;
    
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

exports.getSentiment = async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Fetch last 100 1-minute bars to generate analysis
    const history = await getHistoricalData(symbol, undefined, undefined, 100, 1);
    
    if (!history || history.length < 20) {
      return res.json({
        symbol,
        rsi: 50,
        macd: 'NEUTRAL',
        trend: 'NEUTRAL',
        message: "Insufficient market data to generate accurate AI sentiment.",
        color: "text-gray-400"
      });
    }

    const closePrices = history.map(bar => bar.close || bar.price);
    
    // Quantitative Core Engine
    const rsi = calculateRSI(closePrices, 14);
    const ema9 = calculateEMA(closePrices, 9);
    const ema21 = calculateEMA(closePrices, 21);
    
    let trend = 'NEUTRAL';
    let message = '';
    let color = 'text-gray-400';

    // Advanced Market Structure Logic
    const isBullishCross = ema9 > ema21;
    
    if (rsi > 70) {
      trend = 'BEARISH';
      color = 'text-red-500';
      message = `Overbought Market Detected — RSI is extremely high at ${rsi.toFixed(1)}. The asset is heavily extended above its moving averages. High probability of a retracement or mean-reversion pull-back. Institutional sell walls might appear.`;
    } else if (rsi < 30) {
      trend = 'BULLISH';
      color = 'text-emerald-500';
      message = `Oversold Dump Detected — RSI has crashed to ${rsi.toFixed(1)}, indicating extreme panic selling. The asset is extremely deeply discounted below its moving average, suggesting a high-probability bounce entry point.`;
    } else if (isBullishCross && rsi > 55) {
      trend = 'BULLISH';
      color = 'text-emerald-500';
      message = `Strong Bullish Momentum — EMA crossover structurally intact. RSI is comfortably at ${rsi.toFixed(1)}, indicating substantial room for upward growth before hitting overbought resistance levels.`;
    } else if (!isBullishCross && rsi < 45) {
      trend = 'BEARISH';
      color = 'text-red-500';
      message = `Heavy Bearish Downflow — Nine period EMA is failing to break the longer-term resistance line. RSI sits weakly at ${rsi.toFixed(1)}, signaling lack of buying volume. Continuation down is likely.`;
    } else {
      trend = 'NEUTRAL';
      color = 'text-yellow-500';
      message = `Choppy Consolidation — Moving averages are entangled and RSI is flattened at ${rsi.toFixed(1)}. Market is currently undecided on directional momentum. Trading breakout zones recommended.`;
    }

    res.status(200).json({
      symbol,
      rsi: rsi.toFixed(2),
      ema9,
      ema21,
      trend,
      message,
      color
    });

  } catch (err) {
    logger.error(`AI Sentiment Generator Error: ${err.message}`);
    res.status(500).json({ message: 'Failed to generate market sentiment' });
  }
};
