import { useState, useEffect, useRef } from 'react';
import { BarChart2, ArrowUpDown } from 'lucide-react';

// Stable level generation — call once, then nudge
function buildLevels(basePrice, count, side) {
  if (!basePrice || basePrice <= 0) return [];
  return Array.from({ length: count }, (_, i) => {
    const tick   = basePrice * 0.0005 * (i + 1) * (side === 'ask' ? 1 : -1);
    const price  = +(basePrice + tick).toFixed(2);
    const qty    = Math.floor(Math.random() * 800 + 100) + (i * 150); // Volume often increases at deeper levels
    return { price, qty, orders: Math.floor(Math.random() * 15 + 1) };
  });
}

// Re-compute cumulative totals + fill %
function addDepth(levels) {
  const total = levels.reduce((s, r) => s + r.qty, 0) || 1;
  let cum = 0;
  return levels.map(r => { cum += r.qty; return { ...r, cum, pct: Math.round((cum / total) * 100) }; });
}

export default function OrderBook({ selectedStock, livePrices = {}, orders = [] }) {
  const [activeTab, setActiveTab] = useState('book');
  const askRef  = useRef([]);
  const bidRef  = useRef([]);
  const [asks, setAsks] = useState([]);
  const [bids, setBids] = useState([]);

  const price = selectedStock
    ? (livePrices[selectedStock.symbol] || selectedStock.price || 0)
    : 0;

  // Build fresh levels only when stock changes
  useEffect(() => {
    if (!price) return;
    askRef.current = buildLevels(price, 15, 'ask'); // Level 2: More depth
    bidRef.current = buildLevels(price, 15, 'bid');
    setAsks(addDepth([...askRef.current]));
    setBids(addDepth([...bidRef.current]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock?.symbol]);


  // On price tick: nudge levels slightly instead of rebuilding
  useEffect(() => {
    if (!price || askRef.current.length === 0) return;
    askRef.current = askRef.current.map((r, i) => ({
      ...r,
      price: +(price + price * 0.0005 * (i + 1)).toFixed(2),
      qty:   Math.max(50, r.qty + Math.floor((Math.random() - 0.5) * 60)),
    }));
    bidRef.current = bidRef.current.map((r, i) => ({
      ...r,
      price: +(price - price * 0.0005 * (i + 1)).toFixed(2),
      qty:   Math.max(50, r.qty + Math.floor((Math.random() - 0.5) * 60)),
    }));
    setAsks(addDepth([...askRef.current]));
    setBids(addDepth([...bidRef.current]));
  }, [price]);

  const spread = asks[0] && bids[0]
    ? (asks[0].price - bids[0].price).toFixed(2)
    : '—';

  const trades = orders
    .filter(o => o.status === 'COMPLETED')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 15);

  const symbol = selectedStock?.symbol || 'BOOK';

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-3 py-2 border-b border-edge flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-3 h-3 text-accent shrink-0" />
          <span className="text-xs font-bold text-primary">{symbol}</span>
        </div>
        <div className="flex items-center gap-0.5">
          {[['book', 'Book'], ['depth', 'Depth'], ['trades', 'Trades']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                activeTab === id
                  ? 'bg-accent/15 text-accent'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

          {/* Column headers */}
          <div className="grid grid-cols-3 px-2 py-1 text-[9px] text-muted border-b border-edge/30 shrink-0">
            <span>Price</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Orders</span>
          </div>

          {/* ASKs — shown reversed (closest to spread at bottom) */}
          <div className="flex-1 flex flex-col-reverse overflow-y-auto min-h-0">
            {[...asks].reverse().map((row, i) => (
              <div key={i} className="relative grid grid-cols-3 items-center px-2 py-[3px] hover:bg-surface/40 cursor-default">
                <div className="absolute inset-y-0 right-0 bg-loss/10" style={{ width: `${row.pct}%` }} />
                <span className="relative z-10 text-[10px] font-mono text-loss">{row.price.toFixed(2)}</span>
                <span className="relative z-10 text-[10px] font-mono text-secondary text-center">{row.qty}</span>
                <span className="relative z-10 text-[9px] text-muted text-right">{row.orders}</span>
              </div>
            ))}
          </div>

          {/* Spread / LTP divider */}
          <div className="shrink-0 px-2 py-1 bg-surface/60 border-y border-edge flex items-center justify-between">
            <span className="text-[11px] font-bold font-mono text-primary">
              ₹{price.toFixed(2)}
            </span>
            <div className="flex items-center gap-1 text-[9px] text-muted">
              <ArrowUpDown className="w-2.5 h-2.5" />
              {spread}
            </div>
          </div>

          {/* BIDs */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {bids.map((row, i) => (
              <div key={i} className="relative grid grid-cols-3 items-center px-2 py-[3px] hover:bg-surface/40 cursor-default">
                <div className="absolute inset-y-0 left-0 bg-profit/10" style={{ width: `${row.pct}%` }} />
                <span className="relative z-10 text-[10px] font-mono text-profit">{row.price.toFixed(2)}</span>
                <span className="relative z-10 text-[10px] font-mono text-secondary text-center">{row.qty}</span>
                <span className="relative z-10 text-[9px] text-muted text-right">{row.orders}</span>
              </div>
            ))}
          </div>

          {/* Total bid / ask qty footer */}
          <div className="shrink-0 grid grid-cols-2 border-t border-edge">
            <div className="px-2 py-1 text-center">
              <div className="text-[9px] text-muted">Total Buy</div>
              <div className="text-[10px] font-bold text-profit">
                {bids.reduce((s, r) => s + r.qty, 0).toLocaleString()}
              </div>
            </div>
            <div className="px-2 py-1 text-center border-l border-edge">
              <div className="text-[9px] text-muted">Total Sell</div>
              <div className="text-[10px] font-bold text-loss">
                {asks.reduce((s, r) => s + r.qty, 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'depth' ? (
        /* ── Market Depth Chart ── */
        <div className="flex-1 flex flex-col p-2 space-y-4 overflow-hidden">
           <div className="text-[10px] text-muted flex justify-between font-bold uppercase tracking-widest px-1">
              <span>Bids (Buy)</span>
              <span>Asks (Sell)</span>
           </div>
           
           <div className="flex-1 min-h-0 flex gap-1">
              {/* Bids Wall */}
              <div className="flex-1 h-full flex flex-col justify-end gap-px">
                 {bids.map((b, i) => (
                    <div key={i} className="flex-1 flex flex-row-reverse items-center gap-2 group">
                       <div 
                         className="h-full bg-profit/30 border-r border-profit/20 transition-all duration-500 rounded-l-[1px]" 
                         style={{ width: `${b.pct}%` }} 
                       />
                    </div>
                 ))}
              </div>
              {/* Asks Wall */}
              <div className="flex-1 h-full flex flex-col justify-end gap-px">
                 {[...asks].reverse().map((a, i) => (
                    <div key={i} className="flex-1 flex items-center gap-2 group">
                       <div 
                         className="h-full bg-loss/30 border-l border-loss/20 transition-all duration-500 rounded-r-[1px]" 
                         style={{ width: `${a.pct}%` }} 
                       />
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-surface/40 p-2 rounded-lg border border-edge">
              <div className="flex justify-between text-[10px] mb-1">
                 <span className="text-muted italic">Volume Imbalance</span>
                 <span className={bids.reduce((s,r)=>s+r.qty,0) > asks.reduce((s,r)=>s+r.qty,0) ? 'text-profit' : 'text-loss'}>
                   {((bids.reduce((s,r)=>s+r.qty,0) / (asks.reduce((s,r)=>s+r.qty,0) + bids.reduce((s,r)=>s+r.qty,0))) * 100).toFixed(1)}% Buy
                 </span>
              </div>
              <div className="h-1.5 w-full bg-loss/20 rounded-full overflow-hidden flex">
                 <div 
                   className="h-full bg-profit transition-all duration-700" 
                   style={{ width: `${(bids.reduce((s,r)=>s+r.qty,0) / (asks.reduce((s,r)=>s+r.qty,0) + bids.reduce((s,r)=>s+r.qty,0))) * 100}%` }} 
                 />
              </div>
           </div>
        </div>
      ) : (
        /* ── Trades tab ── */
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-4 px-2 py-1 text-[9px] text-muted border-b border-edge/30 sticky top-0 bg-card">
            <span>Side</span>
            <span>Price</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Time</span>
          </div>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 gap-2">
              <BarChart2 className="w-6 h-6 text-muted/20" />
              <p className="text-[10px] text-muted">No trades yet</p>
            </div>
          ) : (
            trades.map(o => (
              <div key={o._id} className="grid grid-cols-4 items-center px-2 py-1 border-b border-edge/20 hover:bg-surface/40">
                <span className={`text-[10px] font-bold ${o.type === 'BUY' ? 'text-profit' : 'text-loss'}`}>{o.type}</span>
                <span className="text-[10px] font-mono text-primary">{(o.price || 0).toFixed(2)}</span>
                <span className="text-[10px] font-mono text-secondary text-center">{o.quantity}</span>
                <span className="text-[9px] text-muted text-right">
                  {new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
