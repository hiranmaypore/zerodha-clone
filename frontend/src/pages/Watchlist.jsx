import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchlist } from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';
import { connectSocket } from '../services/socket';
import { StockIcon } from '../components/StockIcon';
import { Star, TrendingUp, TrendingDown, Minus, BarChart2, Trash2 } from 'lucide-react';

export default function Watchlist() {
  const navigate = useNavigate();
  const [stocks, setStocks]   = useState([]);
  const [prices, setPrices]   = useState({});
  const [loading, setLoading] = useState(true);
  const { toggle }  = useWatchlist();


  useEffect(() => {
    loadWatchlist();
    const socket = connectSocket();
    socket.on('price_update', (incoming) => setPrices(prev => ({ ...prev, ...incoming })));
    return () => socket.off('price_update');
  }, []);

  const loadWatchlist = async () => {
    try {
      const res = await getWatchlist();
      const list = res.data?.watchlist || res.data?.stocks || [];
      setStocks(list);
      // seed prices from initial data
      const seed = {};
      list.forEach(s => { if (s.currentPrice) seed[s.symbol] = s.currentPrice; });
      setPrices(prev => ({ ...seed, ...prev }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (symbol) => {
    await toggle(symbol);
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Watchlist</h1>
          <p className="text-secondary text-sm mt-1">{stocks.length}/50 stocks tracked</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted bg-card border border-edge rounded-xl px-3 py-2">
          <Star className="w-3.5 h-3.5 text-warning fill-warning" />
          Click the ★ on any chart stock to add it here
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-edge rounded-xl overflow-hidden">
        {/* Column headers */}
        {stocks.length > 0 && (
          <div className="px-5 py-2 grid grid-cols-12 text-[10px] text-muted border-b border-edge font-medium uppercase tracking-wide">
            <div className="col-span-5">Stock</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-3 text-right">Change</div>
            <div className="col-span-1" />
          </div>
        )}

        {stocks.length > 0 ? (
          <div className="divide-y divide-edge">
            {stocks.map(stock => {
              const price   = prices[stock.symbol] ?? stock.currentPrice ?? 0;
              const base    = stock.currentPrice || price;
              const change  = base ? price - base : 0;
              const changePct = base ? (change / base) * 100 : 0;
              const isUp    = changePct >= 0.05;
              const isDown  = changePct <= -0.05;

              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/dashboard?stock=${stock.symbol}`)}
                  className="px-5 py-3.5 grid grid-cols-12 items-center hover:bg-surface/60 transition-colors cursor-pointer group"
                >
                  {/* Symbol + name */}
                  <div className="col-span-5 flex items-center gap-3">
                    <StockIcon symbol={stock.symbol} className="w-8 h-8" textSize="text-xs" />
                    <div>
                      <div className="text-sm font-semibold text-primary">{stock.symbol}</div>
                      <div className="text-[10px] text-muted truncate max-w-[120px]">{stock.name}</div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-3 text-right">
                    <span className="text-sm font-bold font-mono text-primary">
                      ₹{price.toFixed(2)}
                    </span>
                  </div>

                  {/* Change */}
                  <div className={`col-span-3 flex items-center justify-end gap-0.5 text-xs font-mono font-semibold ${
                    isUp ? 'text-profit' : isDown ? 'text-loss' : 'text-muted'
                  }`}>
                    {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/dashboard?stock=${stock.symbol}`); }}
                      title="View chart"
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleRemove(stock.symbol); }}
                      title="Remove from watchlist"
                      className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <Star className="w-10 h-10 mx-auto text-muted/20" />
            <p className="text-sm text-muted">Your watchlist is empty</p>
            <p className="text-xs text-muted/60">
              Click the <Star className="inline w-3 h-3 text-warning fill-warning mx-0.5" /> icon next to any stock on the dashboard to add it here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
