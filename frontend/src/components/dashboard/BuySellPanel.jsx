import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buyOrder, sellOrder } from '../../services/api';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

export default function BuySellPanel({ selectedStock, currentPrice = 0, onOrderPlaced, userBalance }) {
  const { user } = useAuth();
  const balance = userBalance ?? user?.balance ?? 0;

  const [activeTab, setActiveTab] = useState('buy');
  const [quantity, setQuantity] = useState('1');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [sliderValue, setSliderValue] = useState(25);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'success'|'error', text }

  const qty = parseInt(quantity) || 0;
  const execPrice = orderType === 'LIMIT' ? parseFloat(limitPrice) || currentPrice : currentPrice;
  const totalCost = qty * execPrice;
  const brokerage = Math.min(totalCost * 0.0003, 20);
  const gst = brokerage * 0.18;
  const totalCharges = brokerage + gst;
  const netTotal = activeTab === 'buy' ? totalCost + totalCharges : totalCost - totalCharges;
  const maxQtyFromBalance = execPrice > 0 ? Math.floor(balance / execPrice) : 0;

  const handleSlider = (val) => {
    setSliderValue(val);
    if (execPrice > 0) {
      const maxQty = Math.floor(balance / execPrice);
      setQuantity(String(Math.max(1, Math.floor((val / 100) * maxQty))));
    }
  };

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSubmit = async () => {
    if (!selectedStock) return showMsg('error', 'Select a stock first');
    if (qty <= 0) return showMsg('error', 'Enter a valid quantity');
    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0))
      return showMsg('error', 'Enter a valid limit price');
    if (activeTab === 'buy' && netTotal > balance)
      return showMsg('error', 'Insufficient balance');

    setLoading(true);
    try {
      const payload = {
        stockSymbol: selectedStock.symbol,
        quantity: qty,
        orderType,
        ...(orderType === 'LIMIT' && { limitPrice: parseFloat(limitPrice) }),
      };
      if (activeTab === 'buy') await buyOrder(payload);
      else await sellOrder(payload);

      showMsg('success', `${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed for ${selectedStock.symbol}!`);
      setQuantity('1');
      setSliderValue(25);
      onOrderPlaced?.();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Order failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Buy/Sell Tabs */}
      <div className="flex border-b border-edge">
        {['buy', 'sell'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setMsg(null); }}
            className={`flex-1 py-2.5 text-xs font-bold transition-all ${
              activeTab === tab
                ? tab === 'buy'
                  ? 'text-profit border-b-2 border-profit bg-profit/5'
                  : 'text-loss border-b-2 border-loss bg-loss/5'
                : 'text-muted hover:text-primary'
            }`}
          >
            {tab === 'buy' ? '▲ BUY' : '▼ SELL'}
          </button>
        ))}
      </div>

      <div className="p-3 flex-1 flex flex-col gap-2.5 overflow-y-auto">
        {/* Stock Display */}
        <div className="bg-surface rounded-xl px-3 py-2 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-primary">{selectedStock?.symbol || '—'}</div>
            <div className="text-[10px] text-muted truncate max-w-[100px]">{selectedStock?.name || 'Select a stock'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold font-mono text-secondary">₹{currentPrice.toFixed(2)}</div>
            <div className="text-[10px] text-muted">LTP</div>
          </div>
        </div>

        {/* Order Type */}
        <div>
          <label className="text-[10px] text-muted mb-1 block">Order Type</label>
          <div className="flex gap-1.5">
            {['MARKET', 'LIMIT'].map(t => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                  orderType === t
                    ? 'border-accent text-accent bg-accent/10'
                    : 'border-edge text-muted hover:border-secondary hover:text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Limit Price */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="text-[10px] text-muted mb-1 block">Limit Price (₹)</label>
            <input
              type="number"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
              className="w-full bg-surface border border-edge rounded-lg px-3 py-1.5 text-xs text-primary placeholder-muted focus:border-accent focus:outline-none font-mono"
            />
          </div>
        )}

        {/* Quantity */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] text-muted">Quantity</label>
            <span className="text-[10px] text-muted">Max: {maxQtyFromBalance}</span>
          </div>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={e => { setQuantity(e.target.value); setSliderValue(0); }}
            className="w-full bg-surface border border-edge rounded-lg px-3 py-1.5 text-xs text-primary focus:border-accent focus:outline-none font-mono"
          />
        </div>

        {/* Slider */}
        <div>
          <div className="flex justify-between text-[9px] text-muted mb-1">
            <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
          </div>
          <input
            type="range" min="0" max="100" value={sliderValue}
            onChange={e => handleSlider(parseInt(e.target.value))}
            className="w-full accent-range"
            style={{ accentColor: activeTab === 'buy' ? 'var(--color-profit)' : 'var(--color-loss)' }}
          />
        </div>

        {/* Order Summary */}
        <div className="bg-surface rounded-xl px-3 py-2.5 space-y-1.5 text-[10px]">
          <div className="flex justify-between text-muted">
            <span>{qty} × ₹{execPrice.toFixed(2)}</span>
            <span className="font-mono text-primary">₹{totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Brokerage + GST</span>
            <span className="font-mono">₹{totalCharges.toFixed(2)}</span>
          </div>
          <div className="h-px bg-edge my-0.5" />
          <div className="flex justify-between font-semibold text-xs">
            <span className="text-primary">Net {activeTab === 'buy' ? 'Required' : 'Receivable'}</span>
            <span className={`font-mono font-bold ${activeTab === 'buy' ? 'text-loss' : 'text-profit'}`}>
              ₹{netTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Available</span>
            <span className={`font-mono ${balance < netTotal && activeTab === 'buy' ? 'text-loss' : 'text-secondary'}`}>
              ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-medium ${
            msg.type === 'success'
              ? 'bg-profit/10 text-profit border border-profit/20'
              : 'bg-loss/10 text-loss border border-loss/20'
          }`}>
            {msg.type === 'success' ? <CheckCircle className="w-3 h-3 shrink-0" /> : <AlertCircle className="w-3 h-3 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedStock || qty <= 0}
          className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all mt-auto ${
            loading || !selectedStock || qty <= 0
              ? 'opacity-40 cursor-not-allowed'
              : ''
          } ${
            activeTab === 'buy'
              ? 'bg-profit hover:bg-profit/90 text-dark shadow-lg shadow-profit/20'
              : 'bg-loss hover:bg-loss/90 text-white shadow-lg shadow-loss/20'
          }`}
        >
          {loading
            ? 'Processing...'
            : `${activeTab === 'buy' ? '▲ BUY' : '▼ SELL'} ${selectedStock?.symbol || ''}`}
        </button>
      </div>
    </div>
  );
}
