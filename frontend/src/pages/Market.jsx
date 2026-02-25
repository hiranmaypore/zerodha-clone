import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStocks, buyOrder, sellOrder, addToWatchlist } from '../services/api';
import { connectSocket, getSocket } from '../services/socket';
import { TrendingUp, TrendingDown, Star, ShoppingCart, Search } from 'lucide-react';

export default function Market() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { stock, action: 'BUY'|'SELL' }
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadStocks();
    const socket = connectSocket();

    socket.on('price_update', (newPrices) => {
      setPrices(newPrices);
    });

    return () => {
      socket.off('price_update');
    };
  }, []);

  const loadStocks = async () => {
    try {
      const res = await getAllStocks();
      setStocks(res.data.stocks);
      // Set initial prices
      const initial = {};
      res.data.stocks.forEach(s => { initial[s.symbol] = s.price; });
      setPrices(initial);
    } catch (err) {
      console.error('Failed to load stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOrder = async () => {
    if (!quantity || quantity <= 0) return;
    setOrderLoading(true);
    try {
      const payload = {
        stockSymbol: modal.stock.symbol,
        quantity: parseInt(quantity),
        orderType
      };
      if (orderType === 'LIMIT') payload.limitPrice = parseFloat(limitPrice);

      if (modal.action === 'BUY') {
        await buyOrder(payload);
      } else {
        await sellOrder(payload);
      }
      showToast(`${modal.action} order placed for ${modal.stock.symbol}!`);
      setModal(null);
      setQuantity('');
      setLimitPrice('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Order failed', 'error');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleAddWatchlist = async (symbol) => {
    try {
      await addToWatchlist(symbol);
      showToast(`${symbol} added to watchlist`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    }
  };

  const filtered = stocks.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-primary">Market</h1>
          <p className="text-secondary text-sm mt-1">{stocks.length} stocks · Live prices</p>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stocks..."
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-2xl text-sm animate-slide-in
          ${toast.type === 'error' ? 'bg-loss-dim text-loss border border-loss/30' : 'bg-profit-dim text-profit border border-profit/30'}`}>
          {toast.msg}
        </div>
      )}

      {/* Stock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {filtered.map(stock => {
          const price = prices[stock.symbol] || stock.price;
          return (
            <div
              key={stock.symbol}
              onClick={() => navigate(`/dashboard?stock=${stock.symbol}`)}
              className="bg-card border border-edge rounded-xl p-4 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-primary">{stock.symbol}</h3>
                  <p className="text-xs text-muted truncate max-w-[140px]">{stock.name}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleAddWatchlist(stock.symbol); }}
                  className="p-1.5 rounded-lg text-muted hover:text-warning hover:bg-warning/10 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Add to watchlist"
                >
                  <Star className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xl font-bold text-primary mb-1">
                ₹{price?.toFixed(2)}
              </p>
              <p className="text-[10px] text-accent mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to view chart →
              </p>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setModal({ stock, action: 'BUY' }); setQuantity(''); setOrderType('MARKET'); }}
                  className="flex-1 py-1.5 text-xs font-medium bg-profit/10 text-profit rounded-lg hover:bg-profit/20 transition-colors cursor-pointer"
                >
                  BUY
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setModal({ stock, action: 'SELL' }); setQuantity(''); setOrderType('MARKET'); }}
                  className="flex-1 py-1.5 text-xs font-medium bg-loss/10 text-loss rounded-lg hover:bg-loss/20 transition-colors cursor-pointer"
                >
                  SELL
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setModal(null)}>
          <div
            className="bg-card border border-edge rounded-xl p-6 w-full max-w-md animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-primary mb-1">
              <span className={modal.action === 'BUY' ? 'text-profit' : 'text-loss'}>{modal.action}</span>
              {' '}{modal.stock.symbol}
            </h2>
            <p className="text-sm text-muted mb-4">
              Current Price: ₹{(prices[modal.stock.symbol] || modal.stock.price)?.toFixed(2)}
            </p>

            <div className="space-y-4">
              {/* Order Type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('MARKET')}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer
                    ${orderType === 'MARKET' ? 'bg-accent text-white' : 'bg-dark text-secondary border border-edge'}`}
                >
                  Market
                </button>
                <button
                  onClick={() => setOrderType('LIMIT')}
                  className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer
                    ${orderType === 'LIMIT' ? 'bg-accent text-white' : 'bg-dark text-secondary border border-edge'}`}
                >
                  Limit
                </button>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm text-secondary mb-1.5">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  className="w-full"
                  min="1"
                />
              </div>

              {/* Limit Price */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="block text-sm text-secondary mb-1.5">Limit Price (₹)</label>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Enter limit price"
                    className="w-full"
                    step="0.01"
                  />
                </div>
              )}

              {/* Total */}
              {quantity > 0 && (
                <div className="bg-dark rounded-lg p-3 border border-edge">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Estimated Total</span>
                    <span className="text-primary font-medium">
                      ₹{((orderType === 'LIMIT' ? parseFloat(limitPrice) : (prices[modal.stock.symbol] || modal.stock.price)) * parseInt(quantity)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleOrder}
                disabled={orderLoading || !quantity || (orderType === 'LIMIT' && !limitPrice)}
                className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer
                  ${modal.action === 'BUY' ? 'bg-profit hover:bg-profit/80 text-white' : 'bg-loss hover:bg-loss/80 text-white'}`}
              >
                {orderLoading ? 'Placing...' : `${modal.action} ${modal.stock.symbol}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
