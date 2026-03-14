const STOCKS = require('../config/stocks');
const { getPrices } = require('../services/priceSimulator');

/**
 * Algo Backtester Logic
 * Simulates a strategy over a 30-day "virtual" history.
 * In a real app, this would query a OHLCV database.
 */
exports.runBacktest = async (req, res) => {
  const { symbol, strategy, timeframe } = req.body;
  const stock = STOCKS.find(s => s.symbol === symbol.toUpperCase()) || STOCKS[0];
  
  try {
    const days = timeframe === '30D' ? 30 : timeframe === '7D' ? 7 : 14;
    const initialCapital = 100000;
    let capital = initialCapital;
    const history = [];
    const trades = [];
    
    // Simulate data & signals
    let currentPrice = stock.price || 1000;
    for (let i = 0; i < days; i++) {
        // Random walk for price
        const dailyChange = (Math.random() - 0.48) * 0.05; // Slightly biased bullish
        currentPrice = currentPrice * (1 + dailyChange);
        
        // Strategy Logic (Mock)
        let signal = 'NEUTRAL';
        if (strategy === 'EMA_CROSS' && Math.random() > 0.8) signal = 'BUY';
        if (strategy === 'EMA_CROSS' && Math.random() < 0.2) signal = 'SELL';
        if (strategy === 'RSI_REVERSAL' && Math.random() > 0.9) signal = 'BUY';
        if (strategy === 'RSI_REVERSAL' && Math.random() < 0.1) signal = 'SELL';

        if (signal === 'BUY' && capital > currentPrice) {
            const qty = Math.floor((capital * 0.2) / currentPrice);
            trades.push({ type: 'BUY', price: currentPrice, qty, day: i });
            capital -= qty * currentPrice;
        } else if (signal === 'SELL' && trades.some(t => t.type === 'BUY')) {
            const lastBuy = trades.reverse().find(t => t.type === 'BUY');
            trades.reverse(); // put back
            if (lastBuy) {
               capital += lastBuy.qty * currentPrice;
               trades.push({ type: 'SELL', price: currentPrice, qty: lastBuy.qty, pnl: (currentPrice - lastBuy.price) * lastBuy.qty, day: i });
            }
        }

        history.push({
            day: i,
            price: parseFloat(currentPrice.toFixed(2)),
            equity: parseFloat(capital.toFixed(2))
        });
    }

    const totalPnl = capital - initialCapital;
    const winRate = trades.filter(t => t.type === 'SELL' && t.pnl > 0).length / (trades.filter(t => t.type === 'SELL').length || 1) * 100;

    res.json({
        success: true,
        results: {
            symbol: stock.symbol,
            strategy,
            timeframe,
            totalPnl: parseFloat(totalPnl.toFixed(2)),
            pnlPercent: parseFloat(((totalPnl / initialCapital) * 100).toFixed(2)),
            winRate: Math.round(winRate),
            tradesCount: trades.length,
            equityCurve: history,
            finalEquity: capital
        }
    });
  } catch (error) {
    res.status(500).json({ message: 'Backtest failed', error: error.message });
  }
};
