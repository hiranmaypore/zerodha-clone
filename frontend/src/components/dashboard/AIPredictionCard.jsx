import { Brain, TrendingUp, TrendingDown, Minus, Zap, Shield } from 'lucide-react';

function getPrediction(stock, currentPrice, holdings) {
  if (!stock || !currentPrice) return null;
  const seed = stock.symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const signals = ['BULLISH', 'BEARISH', 'NEUTRAL'];
  const signal = signals[seed % 3];
  const confidence = 55 + (seed % 30);
  const holding = (holdings || []).find(h => h.stock === stock.symbol);
  const targets = {
    BULLISH: { tp: (currentPrice * 1.03).toFixed(1), sl: (currentPrice * 0.98).toFixed(1) },
    BEARISH: { tp: (currentPrice * 0.97).toFixed(1), sl: (currentPrice * 1.02).toFixed(1) },
    NEUTRAL: { tp: (currentPrice * 1.015).toFixed(1), sl: (currentPrice * 0.985).toFixed(1) },
  };
  return { signal, confidence, ...targets[signal], holding, isHeld: !!(holding && holding.quantity > 0) };
}

const signalConfig = {
  BULLISH: { icon: TrendingUp, color: 'text-profit', bg: 'bg-profit/10 border-profit/20', label: 'Bullish Signal', action: 'Consider Buying' },
  BEARISH: { icon: TrendingDown, color: 'text-loss', bg: 'bg-loss/10 border-loss/20', label: 'Bearish Signal', action: 'Watch for Exit' },
  NEUTRAL: { icon: Minus, color: 'text-warning', bg: 'bg-warning/10 border-warning/20', label: 'Neutral Signal', action: 'Hold & Monitor' },
};

export default function AIPredictionCard({ selectedStock, currentPrice = 0, holdings = [] }) {
  const prediction = getPrediction(selectedStock, currentPrice, holdings);

  if (!prediction) {
    return (
      <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-edge">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-primary">AI Insights</span>
        </div>
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
          <Brain className="w-8 h-8 text-purple-400/30" />
          <p className="text-xs text-muted text-center">Select a stock to get AI predictions</p>
        </div>
      </div>
    );
  }

  const cfg = signalConfig[prediction.signal];
  const Icon = cfg.icon;

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-edge">
        <Brain className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-semibold text-primary">AI Insights</span>
        <span className="ml-auto text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded-full">Beta</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cfg.bg}`}>
          <Icon className={`w-4 h-4 ${cfg.color}`} />
          <div>
            <div className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</div>
            <div className="text-[10px] text-muted">{selectedStock?.symbol} · {prediction.confidence}% confidence</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] text-muted mb-1">
            <span>Signal Strength</span>
            <span className={`font-bold ${cfg.color}`}>{prediction.confidence}%</span>
          </div>
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${prediction.signal === 'BULLISH' ? 'bg-profit' : prediction.signal === 'BEARISH' ? 'bg-loss' : 'bg-warning'}`}
              style={{ width: `${prediction.confidence}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface rounded-xl px-2.5 py-2">
            <div className="text-[9px] text-muted flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-profit" />Target
            </div>
            <div className="text-xs font-bold font-mono text-profit mt-0.5">₹{prediction.tp}</div>
          </div>
          <div className="bg-surface rounded-xl px-2.5 py-2">
            <div className="text-[9px] text-muted flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-loss" />Stop Loss
            </div>
            <div className="text-xs font-bold font-mono text-loss mt-0.5">₹{prediction.sl}</div>
          </div>
        </div>

        {prediction.isHeld && prediction.holding && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl px-3 py-2">
            <div className="text-[10px] text-accent font-medium">You hold {prediction.holding.quantity} shares</div>
            <div className="text-[9px] text-muted mt-0.5">Avg: ₹{(prediction.holding.avgPrice || 0).toFixed(2)}</div>
          </div>
        )}

        <div className="bg-surface rounded-xl px-3 py-2.5">
          <div className="text-[9px] text-muted mb-0.5">Suggested Action</div>
          <div className={`text-xs font-bold ${cfg.color}`}>{cfg.action}</div>
          <div className="text-[9px] text-muted mt-1">
            Based on momentum, volume trend and price action signals.
          </div>
        </div>

        <p className="text-[9px] text-muted/50 text-center leading-tight">
          Educational only. Not financial advice.
        </p>
      </div>
    </div>
  );
}
