import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PortfolioSummary({ holdings = [], livePrices = {} }) {
  const navigate = useNavigate();

  const enriched = holdings
    .map(h => {
      const cur      = livePrices[h.stock] || h.currentPrice || 0;
      const qty      = Math.abs(h.quantity);
      const invested = h.avgPrice * qty;
      const current  = cur * qty;
      const pnl      = h.quantity > 0 ? current - invested : invested - current;
      const pct      = invested > 0 ? (pnl / invested) * 100 : 0;
      return { ...h, cur, pnl, pct };
    })
    .filter(h => Math.abs(h.quantity) > 0);

  const totalPnl = enriched.reduce((s, h) => s + h.pnl, 0);

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2 border-b border-edge flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Package className="w-3 h-3 text-purple-400 shrink-0" />
          <span className="text-[10px] font-bold text-primary">Portfolio</span>
        </div>
        {enriched.length > 0 && (
          <span className={`text-[10px] font-bold font-mono ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalPnl >= 0 ? '+' : ''}₹{Math.abs(totalPnl) >= 1000
              ? `${(Math.abs(totalPnl) / 1000).toFixed(1)}K`
              : Math.abs(totalPnl).toFixed(0)}
          </span>
        )}
      </div>

      {/* Holdings list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {enriched.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 h-full p-2">
            <Package className="w-6 h-6 text-muted/20" />
            <p className="text-[9px] text-muted text-center">No holdings</p>
          </div>
        ) : (
          enriched.map(h => (
            <button
              key={h.stock}
              onClick={() => navigate(`/dashboard?stock=${h.stock}`)}
              className="w-full flex flex-col px-2.5 py-2 border-b border-edge/40 hover:bg-surface/60 transition-colors last:border-b-0"
            >
              {/* Symbol + P&L % */}
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold text-primary">{h.stock}</span>
                <div className={`flex items-center gap-0.5 text-[9px] font-mono ${h.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {h.pnl >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {h.pct >= 0 ? '+' : ''}{h.pct.toFixed(1)}%
                </div>
              </div>

              {/* Qty + current price */}
              <div className="flex items-center justify-between w-full mt-0.5">
                <span className="text-[8px] text-muted">{Math.abs(h.quantity)} qty</span>
                <span className="text-[8px] font-mono text-secondary">₹{h.cur.toFixed(1)}</span>
              </div>

              {/* Mini P&L bar */}
              <div className="w-full h-0.5 bg-surface rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${h.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`}
                  style={{ width: `${Math.min(100, Math.abs(h.pct) * 5)}%` }}
                />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
