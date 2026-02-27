import { Brain, TrendingUp, TrendingDown, Minus, Zap, Shield, AlertTriangle } from 'lucide-react';

function getPrediction(stock, price, holdings) {
  if (!stock || !price) return null;
  const seed   = stock.symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const sigs   = ['BULLISH', 'BEARISH', 'NEUTRAL'];
  const signal = sigs[seed % 3];
  const conf   = 55 + (seed % 30);
  const held   = (holdings || []).find(h => h.stock === stock.symbol);
  const mult   = { BULLISH: [1.03, 0.98], BEARISH: [0.97, 1.02], NEUTRAL: [1.015, 0.985] }[signal];
  return {
    signal, conf,
    tp: (price * mult[0]).toFixed(2),
    sl: (price * mult[1]).toFixed(2),
    rr: (Math.abs(mult[0] - 1) / Math.abs(1 - mult[1])).toFixed(1),
    isHeld:   !!(held?.quantity),
    heldQty:  held?.quantity  || 0,
    avgPrice: held?.avgPrice  || 0,
  };
}

const CFG = {
  BULLISH: { Icon: TrendingUp,   color: 'text-profit',  bar: 'bg-profit',  badge: 'bg-profit/10  text-profit  border-profit/25',  label: 'Bullish', action: 'Consider Buy'  },
  BEARISH: { Icon: TrendingDown, color: 'text-loss',    bar: 'bg-loss',    badge: 'bg-loss/10    text-loss    border-loss/25',    label: 'Bearish', action: 'Watch Exit'   },
  NEUTRAL: { Icon: Minus,        color: 'text-warning', bar: 'bg-warning', badge: 'bg-warning/10 text-warning border-warning/25', label: 'Neutral', action: 'Hold & Watch' },
};

export default function AIPredictionCard({ selectedStock, currentPrice = 0, holdings = [] }) {
  const pred = getPrediction(selectedStock, currentPrice, holdings);
  const cfg  = pred ? CFG[pred.signal] : null;

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-2 py-2 border-b border-edge flex items-center gap-1.5 shrink-0">
        <Brain className="w-3 h-3 text-purple-400 shrink-0" />
        <span className="text-[10px] font-bold text-primary">AI Insights</span>
        <span className="ml-auto text-[8px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1 py-0.5 rounded-full">β</span>
      </div>

      {!pred ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-1 p-2 text-center">
          <Brain className="w-6 h-6 text-purple-400/20" />
          <p className="text-[9px] text-muted">Select a stock</p>
        </div>
      ) : (
        /* Scrollable content */
        <div className="flex-1 flex flex-col gap-1.5 p-2 min-h-0 overflow-y-auto">

          {/* Signal badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border shrink-0 ${cfg.badge}`}>
            <cfg.Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.color}`} />
            <div className="min-w-0">
              <div className={`text-[10px] font-bold ${cfg.color} leading-tight`}>{cfg.label}</div>
              <div className="text-[8px] text-muted leading-tight">{pred.conf}% confidence</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="shrink-0 space-y-1">
            <div className="flex justify-between text-[9px]">
              <span className="text-muted">Strength</span>
              <span className={`font-bold ${cfg.color}`}>{pred.conf}%</span>
            </div>
            <div className="h-1 bg-surface rounded-full overflow-hidden">
              <div className={`h-full ${cfg.bar} rounded-full`} style={{ width: `${pred.conf}%` }} />
            </div>
          </div>

          {/* TP / SL */}
          <div className="grid grid-cols-2 gap-1 shrink-0">
            <div className="bg-surface rounded-lg p-1.5">
              <div className="flex items-center gap-0.5 text-[8px] text-muted mb-0.5">
                <Zap className="w-2 h-2 text-profit" /> Target
              </div>
              <div className="text-[10px] font-bold font-mono text-profit">₹{pred.tp}</div>
            </div>
            <div className="bg-surface rounded-lg p-1.5">
              <div className="flex items-center gap-0.5 text-[8px] text-muted mb-0.5">
                <Shield className="w-2 h-2 text-loss" /> Stop Loss
              </div>
              <div className="text-[10px] font-bold font-mono text-loss">₹{pred.sl}</div>
            </div>
          </div>

          {/* R:R + action */}
          <div className="bg-surface rounded-lg px-2 py-1.5 flex items-center justify-between shrink-0">
            <div>
              <div className="text-[8px] text-muted">Risk / Reward</div>
              <div className="text-[10px] font-bold font-mono text-secondary">1 : {pred.rr}</div>
            </div>
            <div className={`text-[9px] font-bold ${cfg.color}`}>{cfg.action}</div>
          </div>

          {/* Spacer pushes footer down */}
          <div className="flex-1" />

          {/* Held position */}
          {pred.isHeld && (
            <div className="bg-accent/5 border border-accent/15 rounded-lg px-2 py-1.5 shrink-0">
              <div className="text-[9px] text-accent font-semibold">Held: {pred.heldQty} shares</div>
              <div className="text-[8px] text-muted">Avg ₹{pred.avgPrice.toFixed(1)}</div>
            </div>
          )}

          {/* Disclaimer — pinned at bottom */}
          <div className="flex items-center gap-1 text-[8px] text-muted/40 shrink-0">
            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
            <span>Not financial advice.</span>
          </div>

        </div>
      )}
    </div>
  );
}
