import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buyOrder, sellOrder } from '../../services/api';
import { AlertCircle, CheckCircle, Minus, Plus } from 'lucide-react';

export default function BuySellPanel({ selectedStock, currentPrice = 0, onOrderPlaced, userBalance }) {
  const { user } = useAuth();
  const balance = userBalance ?? user?.balance ?? 0;

  const [tab, setTab]         = useState('buy');
  const [qty, setQty]         = useState(1);
  const [orderType, setOT]    = useState('MARKET');
  const [limitPrice, setLP]   = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]         = useState(null);

  const q          = Math.max(0, parseInt(qty) || 0);
  const execPrice  = orderType === 'LIMIT' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
  const total      = q * execPrice;
  const brokerage  = Math.min(total * 0.0003, 20);
  const charges    = +(brokerage * 1.18).toFixed(2);
  const net        = tab === 'buy' ? total + charges : total - charges;
  const maxQty     = execPrice > 0 ? Math.floor(balance / execPrice) : 0;
  const insufficient = tab === 'buy' && net > balance && q > 0;

  const adjustQty = (delta) => setQty(v => Math.max(1, (parseInt(v) || 1) + delta));

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleSubmit = async () => {
    if (!selectedStock)   return showMsg('error', 'Select a stock first');
    if (q <= 0)           return showMsg('error', 'Enter a valid quantity');
    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0))
      return showMsg('error', 'Enter a valid limit price');
    if (insufficient)     return showMsg('error', 'Insufficient balance');

    setLoading(true);
    try {
      const payload = {
        stockSymbol: selectedStock.symbol,
        quantity: q,
        orderType,
        ...(orderType === 'LIMIT' && { limitPrice: parseFloat(limitPrice) }),
      };
      if (tab === 'buy') await buyOrder(payload);
      else               await sellOrder(payload);

      showMsg('success', `${tab === 'buy' ? 'Buy' : 'Sell'} order placed!`);
      setQty(1);
      setLP('');
      onOrderPlaced?.();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Order failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isBuy  = tab === 'buy';

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">

      {/* ── BUY / SELL tabs ── */}
      <div className="flex border-b border-edge shrink-0">
        <button
          onClick={() => { setTab('buy'); setMsg(null); }}
          className={`flex-1 py-1.5 text-[11px] font-bold tracking-wide transition-all ${
            isBuy ? 'bg-profit text-dark' : 'text-profit/60 hover:text-profit bg-transparent'
          }`}
        >
          ▲ BUY
        </button>
        <button
          onClick={() => { setTab('sell'); setMsg(null); }}
          className={`flex-1 py-1.5 text-[11px] font-bold tracking-wide transition-all ${
            !isBuy ? 'bg-loss text-white' : 'text-loss/60 hover:text-loss bg-transparent'
          }`}
        >
          ▼ SELL
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-1.5 p-2 overflow-y-auto min-h-0">

        {/* ── Stock + LTP ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-primary leading-tight truncate">{selectedStock?.symbol || '—'}</div>
            <div className="text-[9px] text-muted leading-tight">₹{currentPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* ── Order Type ── */}
        <div>
          <div className="text-[9px] text-muted mb-1">Order Type</div>
          <div className="grid grid-cols-2 gap-1">
            {['MARKET', 'LIMIT'].map(t => (
              <button
                key={t}
                onClick={() => setOT(t)}
                className={`py-1 rounded text-[9px] font-semibold border transition-all ${
                  orderType === t
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-edge text-muted hover:text-primary hover:border-secondary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ── Limit Price ── */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="text-[9px] text-muted mb-1">Limit Price (₹)</div>
            <input
              type="number"
              value={limitPrice}
              onChange={e => setLP(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
              className="w-full bg-surface border border-edge rounded px-2 py-1 text-[10px] text-primary placeholder-muted focus:border-accent outline-none font-mono"
            />
          </div>
        )}

        {/* ── Quantity ── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[9px] text-muted">Qty</div>
            <div className="text-[9px] text-muted">Max: <span className="text-secondary font-mono">{maxQty}</span></div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => adjustQty(-1)}
              className="w-6 h-6 flex items-center justify-center rounded bg-surface border border-edge text-muted hover:text-primary transition-colors shrink-0"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={e => setQty(e.target.value)}
              className="flex-1 bg-surface border border-edge rounded px-1 py-1 text-[10px] text-primary focus:border-accent outline-none font-mono text-center min-w-0"
            />
            <button
              onClick={() => adjustQty(1)}
              className="w-6 h-6 flex items-center justify-center rounded bg-surface border border-edge text-muted hover:text-primary transition-colors shrink-0"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* ── Quick % buttons ── */}
        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              onClick={() => setQty(Math.max(1, Math.floor((pct / 100) * maxQty)))}
              className={`text-[9px] py-1 rounded border font-medium transition-colors ${
                isBuy
                  ? 'border-profit/20 text-profit/70 hover:border-profit hover:text-profit hover:bg-profit/5'
                  : 'border-loss/20 text-loss/70 hover:border-loss hover:text-loss hover:bg-loss/5'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* ── Order Summary ── */}
        <div className="bg-surface rounded-lg p-2 space-y-1 text-[9px]">
          <div className="flex justify-between text-muted">
            <span>{q} × ₹{execPrice.toFixed(0)}</span>
            <span className="font-mono text-secondary">₹{total.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Brokerage</span>
            <span className="font-mono">₹{charges.toFixed(2)}</span>
          </div>
          <div className="h-px bg-edge" />
          <div className="flex justify-between">
            <span className="font-semibold text-primary text-[9px]">Net {isBuy ? 'Req.' : 'Recv.'}</span>
            <span className={`font-bold font-mono ${isBuy ? 'text-loss' : 'text-profit'} ${insufficient ? 'text-loss' : ''}`}>
              ₹{net.toFixed(0)}
            </span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Avail.</span>
            <span className={`font-mono ${insufficient ? 'text-loss' : 'text-secondary'}`}>
              ₹{(balance / 1000).toFixed(1)}K
            </span>
          </div>
        </div>

        {/* ── Message ── */}
        {msg && (
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[9px] font-medium ${
            msg.type === 'success'
              ? 'bg-profit/10 text-profit border border-profit/20'
              : 'bg-loss/10 text-loss border border-loss/20'
          }`}>
            {msg.type === 'success'
              ? <CheckCircle className="w-3 h-3 shrink-0" />
              : <AlertCircle className="w-3 h-3 shrink-0" />}
            {msg.text}
          </div>
        )}

        {/* ── Submit ── */}
        <button
          onClick={handleSubmit}
          disabled={loading || !selectedStock || q <= 0 || insufficient}
          className={`w-full py-2 rounded text-[11px] font-bold tracking-wide transition-all mt-auto ${
            loading || !selectedStock || q <= 0 || insufficient
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:opacity-90'
          } ${isBuy ? 'bg-profit text-dark shadow-lg shadow-profit/20' : 'bg-loss text-white shadow-lg shadow-loss/20'}`}
        >
          {loading ? 'Processing…' : `${isBuy ? '▲ BUY' : '▼ SELL'} ${selectedStock?.symbol || ''}`}
        </button>

      </div>
    </div>
  );
}
