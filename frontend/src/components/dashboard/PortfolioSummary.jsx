import { TrendingUp, TrendingDown, Package } from 'lucide-react';

export default function PortfolioSummary({ holdings = [], livePrices = {} }) {
  const enriched = holdings.map(h => {
    const currentPrice = livePrices[h.stock] || h.currentPrice || 0;
    const invested = h.avgPrice * Math.abs(h.quantity);
    const current = currentPrice * Math.abs(h.quantity);
    const pnl = h.quantity > 0 ? current - invested : invested - current;
    const pct = invested > 0 ? (pnl / invested) * 100 : 0;
    return { ...h, currentPrice, pnl, pct };
  }).filter(h => Math.abs(h.quantity) > 0);

  const totalPnl = enriched.reduce((s, h) => s + h.pnl, 0);

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-edge flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-semibold text-primary">Portfolio</span>
        </div>
        <span className={`text-[10px] font-bold font-mono ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
          {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Holdings list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 text-center px-4 gap-2">
            <Package className="w-7 h-7 text-muted/30" />
            <p className="text-xs text-muted">No holdings yet</p>
            <p className="text-[10px] text-muted/60">Buy some stocks to start</p>
          </div>
        ) : (
          <div className="divide-y divide-edge">
            {enriched.map(h => (
              <div key={h.stock} className="px-3 py-2 hover:bg-surface/50 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-primary truncate">{h.stock}</div>
                    <div className="text-[9px] text-muted">
                      {Math.abs(h.quantity)} × ₹{(h.avgPrice || 0).toFixed(1)}
                      {h.quantity < 0 && <span className="ml-1 text-loss">(Short)</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono font-semibold text-primary">
                      ₹{(h.currentPrice || 0).toFixed(1)}
                    </div>
                    <div className={`text-[9px] font-mono flex items-center gap-0.5 justify-end ${h.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {h.pnl >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {h.pct >= 0 ? '+' : ''}{h.pct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
