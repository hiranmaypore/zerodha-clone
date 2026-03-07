import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchlist } from '../services/api';
import { useWatchlist } from '../hooks/useWatchlist';
import { connectSocket } from '../services/socket';
import { StockIcon } from '../components/StockIcon';
import BacktestPanel from '../components/dashboard/BacktestPanel';
import { Star, TrendingUp, TrendingDown, Minus, BarChart2, Trash2, Activity } from 'lucide-react';

export default function Watchlist() {
  const navigate = useNavigate();
  const [stocks, setStocks]   = useState([]);
  const [prices, setPrices]   = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const { toggle }  = useWatchlist();


  const loadWatchlist = useCallback(async () => {
    try {
      const res = await getWatchlist();
      const list = res.data?.watchlist || res.data?.stocks || [];
      setStocks(list);
      
      // Set initial selected stock only if none is selected
      setSelectedStock(prev => prev || list[0] || null);
      
      const seed = {};
      list.forEach(s => { if (s.currentPrice) seed[s.symbol] = s.currentPrice; });
      setPrices(prev => ({ ...seed, ...prev }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []); // Remove selectedStock to avoid infinite loop

  useEffect(() => {
    loadWatchlist();
    const socket = connectSocket();
    socket.on('price_update', (incoming) => setPrices(prev => ({ ...prev, ...incoming })));
    return () => socket.off('price_update');
  }, [loadWatchlist]);

  const handleRemove = async (symbol) => {
    await toggle(symbol);
    setStocks(prev => prev.filter(s => s.symbol !== symbol));
    if (selectedStock?.symbol === symbol) setSelectedStock(stocks[0] || null);
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

      <div className="grid grid-cols-12 gap-6">
        {/* Watchlist Table */}
        <div className="col-span-12 lg:col-span-8">
          <div className="bg-card border border-edge rounded-xl overflow-hidden shadow-sm">
            {/* Column headers */}
            {stocks.length > 0 && (
              <div className="px-5 py-2 grid grid-cols-12 text-[10px] text-muted border-b border-edge font-medium uppercase tracking-wide">
                <div className="col-span-1" />
                <div className="col-span-4">Stock</div>
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
                  const isSelected = selectedStock?.symbol === stock.symbol;

                  return (
                    <div
                      key={stock.symbol}
                      onClick={() => setSelectedStock(stock)}
                      className={`px-5 py-3.5 grid grid-cols-12 items-center transition-all cursor-pointer group hover:bg-surface ${
                        isSelected ? 'bg-accent/5 ring-1 ring-inset ring-accent/10 border-l-4 border-l-accent' : ''
                      }`}
                    >
                      {/* Active indicator */}
                      <div className="col-span-1">
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] animate-pulse" />}
                      </div>

                      {/* Symbol + name */}
                      <div className="col-span-4 flex items-center gap-3">
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
                          title="Open in Terminal"
                          className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <BarChart2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleRemove(stock.symbol); }}
                          title="Remove"
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
              <div className="py-24 text-center space-y-4">
                <Star className="w-12 h-12 mx-auto text-muted/10" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-primary">Your watchlist is empty</p>
                  <p className="text-xs text-muted max-w-xs mx-auto">
                    Add stocks from the dashboard to track them and run backtests here.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/80 transition-all active:scale-95"
                >
                  Go to Terminal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quant Backtest Module Sidebar */}
        <div className="col-span-12 lg:col-span-4 h-fit sticky top-6">
           <div className="space-y-4">
              <div className="bg-card border border-edge rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Activity className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-primary uppercase tracking-tight">Quant Mode</h3>
                    <p className="text-[10px] text-muted">Analyzing {selectedStock?.symbol || 'Markets'}</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-profit/10 rounded-md">
                   <span className="text-[9px] font-bold text-profit">LIVE CORE</span>
                </div>
              </div>

              <div className="h-[450px]">
                <BacktestPanel selectedStock={selectedStock} />
              </div>

              <div className="bg-surface border border-edge rounded-xl p-3">
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  💡 Select any stock from your list to automatically run a 24-hour EMA Crossover simulation.
                </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
