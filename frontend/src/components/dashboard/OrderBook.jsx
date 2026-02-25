import { useState, useEffect } from 'react';
import { BarChart2, ArrowUpDown } from 'lucide-react';

// Generate realistic order book levels around a price
function generateLevels(price, count = 8, side = 'ask') {
  if (!price || price <= 0) return [];
  const levels = [];
  const maxTotal = Math.floor(Math.random() * 10000 + 5000);
  let cumTotal = 0;
  for (let i = 0; i < count; i++) {
    const offset = (i + 1) * (price * 0.0005) * (side === 'ask' ? 1 : -1);
    const levelPrice = +(price + offset).toFixed(2);
    const qty = Math.floor(Math.random() * 400 + 50);
    cumTotal += qty * levelPrice;
    levels.push({ price: levelPrice, qty, total: Math.min(cumTotal, maxTotal) });
  }
  const maxT = levels[levels.length - 1]?.total || 1;
  return levels.map(l => ({ ...l, pct: (l.total / maxT) * 100 }));
}

export default function OrderBook({ selectedStock, livePrices = {}, orders = [] }) {
  const [activeTab, setActiveTab] = useState('orderbook');
  const [askData, setAskData] = useState([]);
  const [bidData, setBidData] = useState([]);

  const currentPrice = selectedStock
    ? (livePrices[selectedStock.symbol] || selectedStock.price || 0)
    : 0;

  useEffect(() => {
    if (!currentPrice) return;
    setAskData(generateLevels(currentPrice, 7, 'ask'));
    setBidData(generateLevels(currentPrice, 7, 'bid'));
  }, [currentPrice]);

  const spread = askData[0] && bidData[0]
    ? Math.abs(askData[0].price - bidData[0].price).toFixed(2)
    : '—';

  const completedOrders = orders.filter(o => o.status === 'COMPLETED').slice(0, 10);

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-edge flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-primary">
            {selectedStock?.symbol || 'Book'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {['orderbook', 'trades'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                activeTab === t ? 'bg-accent text-dark' : 'text-muted hover:text-primary'
              }`}
            >
              {t === 'orderbook' ? 'Book' : 'Trades'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'orderbook' ? (
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Column headers */}
          <div className="flex justify-between px-2 py-1 text-[9px] text-muted border-b border-edge/50">
            <span>Price</span><span>Qty</span><span>Total</span>
          </div>

          {/* ASKs (sells) */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col-reverse">
            {[...askData].reverse().map((row, i) => (
              <div key={i} className="relative flex justify-between items-center px-2 py-0.5 group cursor-default">
                <div
                  className="absolute inset-0 bg-loss/8 origin-right"
                  style={{ width: `${row.pct}%`, left: 'auto', right: 0 }}
                />
                <span className="relative text-[10px] font-mono text-loss z-10">₹{row.price}</span>
                <span className="relative text-[10px] font-mono text-muted z-10">{row.qty}</span>
                <span className="relative text-[9px] font-mono text-muted/60 z-10">{(row.total / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>

          {/* Spread / LTP */}
          <div className="px-3 py-1.5 bg-surface border-y border-edge flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-secondary">₹{currentPrice.toFixed(2)}</span>
            <div className="flex items-center gap-1 text-[9px] text-muted">
              <ArrowUpDown className="w-2.5 h-2.5" />
              Spread: {spread}
            </div>
          </div>

          {/* BIDs (buys) */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {bidData.map((row, i) => (
              <div key={i} className="relative flex justify-between items-center px-2 py-0.5 group cursor-default">
                <div
                  className="absolute inset-0 bg-profit/8"
                  style={{ width: `${row.pct}%` }}
                />
                <span className="relative text-[10px] font-mono text-profit z-10">₹{row.price}</span>
                <span className="relative text-[10px] font-mono text-muted z-10">{row.qty}</span>
                <span className="relative text-[9px] font-mono text-muted/60 z-10">{(row.total / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Trades view */
        <div className="flex-1 overflow-y-auto min-h-0">
          {completedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-6">
              <BarChart2 className="w-7 h-7 text-muted/30" />
              <p className="text-xs text-muted">No trades yet</p>
            </div>
          ) : (
            <div className="divide-y divide-edge/50">
              {completedOrders.map(order => (
                <div key={order._id} className="flex items-center justify-between px-3 py-1.5">
                  <span className={`text-[10px] font-bold ${order.type === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                    {order.type}
                  </span>
                  <span className="text-[10px] font-mono text-primary">₹{(order.price || 0).toFixed(2)}</span>
                  <span className="text-[10px] text-muted">{order.quantity}</span>
                  <span className="text-[9px] text-muted">
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
