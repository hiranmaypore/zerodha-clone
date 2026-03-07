import { useState, useEffect, useCallback } from 'react';
import { getPriceHistory } from '../../services/api';
import { Activity, Play, TrendingUp, TrendingDown, Target, History } from 'lucide-react';

export default function BacktestPanel({ selectedStock }) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const duration = '24h'; // Fixed for now, can be expanded later

  const runBacktest = useCallback(async () => {
    if (!selectedStock) return;
    setLoading(true);
    try {
      const { data } = await getPriceHistory(selectedStock.symbol, '1m');
      const history = data.history || [];
      
      if (history.length < 50) throw new Error('Not enough data');

      // Strategy Params
      const FAST = 9;
      const SLOW = 21;
      
      let pnl = 0;
      let pos = 0; // 0, 1 (long)
      let trades = 0;
      let wins = 0;
      let entryPrice = 0;

      // O(N) EMA Calculation
      const calcEMA = (prices, period) => {
        const k = 2 / (period + 1);
        let ema = prices[0].close;
        const results = [ema];
        for (let i = 1; i < prices.length; i++) {
          ema = (prices[i].close - ema) * k + ema;
          results.push(ema);
        }
        return results;
      };

      const fastEma = calcEMA(history, FAST);
      const slowEma = calcEMA(history, SLOW);

      for (let i = 1; i < history.length; i++) {
        const prevFast = fastEma[i-1];
        const prevSlow = slowEma[i-1];
        const currFast = fastEma[i];
        const currSlow = slowEma[i];

        // BUY Signal
        if (prevFast <= prevSlow && currFast > currSlow) {
          if (pos === 0) {
            pos = 1;
            entryPrice = history[i].close;
            trades++;
          }
        }
        // SELL Signal
        else if (prevFast >= prevSlow && currFast < currSlow) {
          if (pos === 1) {
            pos = 0;
            const exitPrice = history[i].close;
            const tradePnl = exitPrice - entryPrice;
            pnl += tradePnl;
            if (tradePnl > 0) wins++;
          }
        }
      }

      setStats({
        pnl,
        pnlPct: (pnl / (history[0].close || 1)) * 100,
        trades,
        winRate: trades > 0 ? (wins / trades) * 100 : 0,
        samples: history.length
      });
    } catch (e) {
      console.error(e);
      setStats({ error: e.message });
    } finally {
      setLoading(false);
    }
  }, [selectedStock]);

  useEffect(() => {
    if (selectedStock) {
      const timer = setTimeout(runBacktest, 100); // Debounce to allow price history to settle
      return () => clearTimeout(timer);
    }
  }, [selectedStock, duration, runBacktest]);

  return (
    <div className="bg-card border border-edge rounded-xl h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-edge bg-surface/30">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-accent" />
          <span className="text-[11px] font-bold text-primary">Quant Backtest (24h)</span>
        </div>
        <button 
          onClick={runBacktest} 
          disabled={loading}
          className="p-1 hover:bg-surface rounded-md transition-colors"
        >
          <Activity className={`w-3 h-3 ${loading ? 'animate-spin text-accent' : 'text-muted'}`} />
        </button>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {!stats && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-muted py-8">
            <Play className="w-8 h-8 opacity-10 mb-2" />
            <p className="text-[10px]">Select a stock to see historical performance</p>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-2 py-8">
            <div className="w-6 h-6 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] text-muted animate-pulse">Analyzing tick data...</p>
          </div>
        )}

        {stats && !loading && !stats.error && (
          <div className="animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4">
              <div className={`text-xl font-bold font-mono ${stats.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {stats.pnl >= 0 ? '+' : ''}₹{stats.pnl.toFixed(2)}
              </div>
              <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${stats.pnl >= 0 ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                {stats.pnlPct.toFixed(2)}%
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface rounded-xl p-2 border border-edge">
                <div className="text-[9px] text-muted mb-0.5 uppercase tracking-wider">Total Trades</div>
                <div className="text-sm font-bold text-primary font-mono">{stats.trades}</div>
              </div>
              <div className="bg-surface rounded-xl p-2 border border-edge">
                <div className="text-[9px] text-muted mb-0.5 uppercase tracking-wider">Win Rate</div>
                <div className="text-sm font-bold text-primary font-mono">{stats.winRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-edge space-y-2">
              <div className="flex justify-between text-[9px]">
                <span className="text-muted">Strategy</span>
                <span className="text-primary font-bold">EMA Crossover (9/21)</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-muted">Analysis Interval</span>
                <span className="text-primary">1m Candle Stick</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span className="text-muted">Data Points</span>
                <span className="text-primary">{stats.samples} ticks</span>
              </div>
            </div>

            <p className="text-[8px] text-muted-foreground mt-4 leading-relaxed bg-surface/50 p-2 rounded-lg italic">
              * Backtest simulates the strategy over the last 1440 minutes of trading data. Past performance does not guarantee future results.
            </p>
          </div>
        )}

        {stats?.error && (
          <div className="bg-loss/10 border border-loss/20 text-loss p-3 rounded-lg text-xs">
            ⚠️ {stats.error}
          </div>
        )}
      </div>
    </div>
  );
}
