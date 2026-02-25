import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist } from '../services/api';
import { connectSocket } from '../services/socket';
import { Star, Trash2, X } from 'lucide-react';

export default function Watchlist() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(null);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWatchlist();
    const socket = connectSocket();
    socket.on('price_update', setPrices);
    return () => socket.off('price_update');
  }, []);

  const loadWatchlist = async () => {
    try {
      const res = await getWatchlist();
      setWatchlist(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (symbol) => {
    try {
      await removeFromWatchlist(symbol);
      loadWatchlist();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  const stocks = watchlist?.stocks || [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Watchlist</h1>
        <p className="text-secondary text-sm mt-1">{stocks.length}/50 stocks saved</p>
      </div>

      <div className="bg-card border border-edge rounded-xl overflow-hidden">
        {stocks.length > 0 ? (
          <div className="divide-y divide-edge">
            {stocks.map(stock => {
              const price = prices[stock.symbol] || stock.currentPrice;
              return (
                <div
                  key={stock.symbol}
                  onClick={() => navigate(`/dashboard?stock=${stock.symbol}`)}
                  className="px-5 py-4 flex items-center justify-between hover:bg-hover transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-warning fill-warning shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-primary">{stock.symbol}</p>
                      <p className="text-xs text-muted">{stock.name || stock.symbol}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">View chart →</p>
                    <p className="text-sm font-bold text-primary">₹{price?.toFixed(2) || '—'}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(stock.symbol); }}
                      className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss-dim transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-muted text-sm">
            <Star className="w-8 h-8 mx-auto mb-3 opacity-50" />
            Your watchlist is empty. Add stocks from the Market page!
          </div>
        )}
      </div>
    </div>
  );
}
