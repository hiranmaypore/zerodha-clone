import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { buyOrder, sellOrder, placeBracket } from '../../services/api';
import { AlertCircle, CheckCircle, Minus, Plus, Shield, Target } from 'lucide-react';

export default function BuySellPanel({ selectedStock, currentPrice = 0, onOrderPlaced, userBalance }) {
  const { user } = useAuth();
  const balance = userBalance ?? user?.balance ?? 0;

  const [tab, setTab]           = useState('buy');          // 'buy' | 'sell'
  const [qty, setQty]           = useState(1);
  const [orderType, setOT]      = useState('MARKET');        // 'MARKET' | 'LIMIT'
  const [productType, setPT]    = useState('CNC');           // 'CNC' | 'MIS'
  const [limitPrice, setLP]     = useState('');
  const [bracketMode, setBM]    = useState(false);
  const [stopLoss, setSL]       = useState('');
  const [target, setTarget]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [msg, setMsg]           = useState(null);

  const q           = Math.max(0, parseInt(qty) || 0);
  const execPrice   = orderType === 'LIMIT' ? (parseFloat(limitPrice) || currentPrice) : currentPrice;
  const total       = q * execPrice;
  const brokerage   = Math.min(total * 0.0003, 20);
  const charges     = +(brokerage * 1.18).toFixed(2);
  const net         = tab === 'buy' ? total + charges : total - charges;
  const maxQty      = execPrice > 0 ? Math.floor(balance / execPrice) : 0;
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

    // Bracket order validation
    if (bracketMode && tab === 'buy') {
      const sl = parseFloat(stopLoss);
      const tg = parseFloat(target);
      const entry = parseFloat(limitPrice) || currentPrice;
      if (!sl || sl <= 0) return showMsg('error', 'Enter a valid Stop Loss price');
      if (!tg || tg <= 0) return showMsg('error', 'Enter a valid Target price');
      if (sl >= entry)    return showMsg('error', 'Stop Loss must be below entry price');
      if (tg <= entry)    return showMsg('error', 'Target must be above entry price');
    }

    setLoading(true);
    try {
      if (bracketMode && tab === 'buy') {
        const entryPx = parseFloat(limitPrice) || currentPrice;
        await placeBracket({
          stockSymbol: selectedStock.symbol,
          quantity: q,
          entryPrice: entryPx,
          targetPrice: parseFloat(target),
          stopLossPrice: parseFloat(stopLoss),
          productType,
        });
        showMsg('success', `Bracket order placed at ₹${entryPx.toFixed(2)}`);
      } else {
        const payload = {
          stockSymbol: selectedStock.symbol,
          quantity: q,
          orderType,
          productType,
          ...(orderType === 'LIMIT' && { limitPrice: parseFloat(limitPrice) }),
        };
        if (tab === 'buy') await buyOrder(payload);
        else               await sellOrder(payload);
        showMsg('success', `${tab === 'buy' ? 'Buy' : 'Sell'} order placed! (${productType})`);
      }
      setQty(1); setLP(''); setSL(''); setTarget('');
      onOrderPlaced?.();
    } catch (e) {
      showMsg('error', e.response?.data?.message || 'Order failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const isBuy = tab === 'buy';

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
          onClick={() => { setTab('sell'); setMsg(null); setBM(false); }}
          className={`flex-1 py-1.5 text-[11px] font-bold tracking-wide transition-all ${
            !isBuy ? 'bg-loss text-white' : 'text-loss/60 hover:text-loss bg-transparent'
          }`}
        >
          ▼ SELL
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto min-h-0">

        {/* ── Stock + LTP ── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-primary leading-tight truncate">{selectedStock?.symbol || '—'}</div>
            <div className="text-[9px] text-muted leading-tight">₹{currentPrice.toFixed(2)}</div>
          </div>
          <div className="text-[9px] text-muted text-right">
            Balance<br/>
            <span className="text-primary font-mono font-semibold">₹{(balance/1000).toFixed(1)}K</span>
          </div>
        </div>

        {/* ── Product Type (CNC / MIS) ── */}
        <div>
          <div className="text-[9px] text-muted mb-1">Product</div>
          <div className="grid grid-cols-2 gap-1">
            {['CNC', 'MIS'].map(pt => (
              <button
                key={pt}
                onClick={() => setPT(pt)}
                className={`py-1 rounded text-[9px] font-bold transition-all ${
                  productType === pt
                    ? (pt === 'CNC' ? 'bg-accent text-white' : 'bg-warning/80 text-dark')
                    : 'bg-surface text-muted hover:text-primary'
                }`}
              >
                {pt === 'CNC' ? '🏦 CNC' : '⚡ MIS'}
              </button>
            ))}
          </div>
          <div className="text-[8px] text-muted/60 mt-0.5">
            {productType === 'CNC' ? 'Long-term delivery' : 'Intraday position (auto SQ-off)'}
          </div>
        </div>

        {/* ── Order Type ── */}
        <div>
          <div className="text-[9px] text-muted mb-1">Order Type</div>
          <div className="grid grid-cols-2 gap-1">
            {['MARKET', 'LIMIT'].map(ot => (
              <button
                key={ot}
                onClick={() => setOT(ot)}
                className={`py-1 rounded text-[9px] font-bold transition-all ${
                  orderType === ot ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-primary'
                }`}
              >
                {ot}
              </button>
            ))}
          </div>
        </div>

        {/* ── Limit Price (only for LIMIT) ── */}
        {orderType === 'LIMIT' && (
          <div>
            <div className="text-[9px] text-muted mb-1">Limit Price</div>
            <input
              type="number" min="0" step="0.05"
              value={limitPrice} onChange={e => setLP(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
              className="w-full bg-surface border border-edge rounded px-2 py-1 text-xs text-primary placeholder-muted focus:border-accent outline-none"
            />
          </div>
        )}

        {/* ── Qty stepper ── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-muted">Qty</span>
            {maxQty > 0 && (
              <button onClick={() => setQty(maxQty)} className="text-[8px] text-accent hover:underline">
                Max {maxQty}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => adjustQty(-1)} className="w-6 h-6 rounded bg-surface border border-edge flex items-center justify-center hover:bg-hover">
              <Minus className="w-3 h-3 text-muted" />
            </button>
            <input
              type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
              className="flex-1 bg-surface border border-edge rounded px-2 py-0.5 text-xs text-center text-primary outline-none focus:border-accent"
            />
            <button onClick={() => adjustQty(1)} className="w-6 h-6 rounded bg-surface border border-edge flex items-center justify-center hover:bg-hover">
              <Plus className="w-3 h-3 text-muted" />
            </button>
          </div>
        </div>

        {/* ── Bracket Order Toggle (only for BUY + LIMIT) ── */}
        {isBuy && (
          <div>
            <button
              onClick={() => setBM(b => !b)}
              className={`w-full py-1 rounded flex items-center justify-center gap-1.5 text-[9px] font-semibold transition-all border ${
                bracketMode
                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                  : 'bg-surface border-edge text-muted hover:text-primary'
              }`}
            >
              <Shield className="w-3 h-3" />
              {bracketMode ? 'Bracket Order (ON)' : 'Enable Bracket (SL + Target)'}
            </button>
          </div>
        )}

        {/* ── Bracket Order Fields ── */}
        {bracketMode && isBuy && (
          <div className="bg-surface/60 border border-edge/50 rounded-lg p-2 space-y-1.5">
            <div className="text-[9px] text-purple-300 font-semibold mb-1 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Bracket Parameters
            </div>
            {/* Entry Price mandatory for bracket */}
            <div>
              <div className="text-[8px] text-muted mb-0.5">Entry Price (₹)</div>
              <input
                type="number" min="0" step="0.05"
                value={limitPrice} onChange={e => setLP(e.target.value)}
                placeholder={currentPrice.toFixed(2)}
                className="w-full bg-dark border border-edge rounded px-2 py-1 text-[10px] text-primary placeholder-muted focus:border-accent outline-none"
              />
            </div>
            <div>
              <div className="text-[8px] text-loss mb-0.5">Stop Loss (₹)</div>
              <input
                type="number" min="0" step="0.05"
                value={stopLoss} onChange={e => setSL(e.target.value)}
                placeholder="e.g. 490"
                className="w-full bg-dark border border-loss/30 rounded px-2 py-1 text-[10px] text-primary placeholder-muted/40 focus:border-loss outline-none"
              />
            </div>
            <div>
              <div className="text-[8px] text-profit mb-0.5 flex items-center gap-1"><Target className="w-2.5 h-2.5" />Target (₹)</div>
              <input
                type="number" min="0" step="0.05"
                value={target} onChange={e => setTarget(e.target.value)}
                placeholder="e.g. 520"
                className="w-full bg-dark border border-profit/30 rounded px-2 py-1 text-[10px] text-primary placeholder-muted/40 focus:border-profit outline-none"
              />
            </div>
            {limitPrice && stopLoss && target && (
              <div className="text-[8px] text-muted space-y-0.5 pt-1 border-t border-edge">
                <div className="flex justify-between">
                  <span className="text-loss">Max Loss:</span>
                  <span className="font-mono text-loss">₹{((parseFloat(limitPrice || 0) - parseFloat(stopLoss || 0)) * q).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-profit">Max Gain:</span>
                  <span className="font-mono text-profit">₹{((parseFloat(target || 0) - parseFloat(limitPrice || 0)) * q).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Order summary ── */}
        {!bracketMode && (
          <div className="bg-surface rounded-lg p-2 space-y-1">
            <div className="flex justify-between text-[9px]">
              <span className="text-muted">Subtotal</span>
              <span className="text-primary font-mono">₹{total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-muted">Charges</span>
              <span className="text-primary font-mono">₹{charges.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-[10px] font-bold border-t border-edge pt-1 ${insufficient ? 'text-loss' : 'text-primary'}`}>
              <span>Net {isBuy ? 'Required' : 'Credit'}</span>
              <span className="font-mono">₹{net.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ── Feedback message ── */}
        {msg && (
          <div className={`flex items-center gap-1.5 text-[10px] rounded px-2 py-1 ${
            msg.type === 'success' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
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
          disabled={loading || q <= 0 || insufficient}
          className={`w-full py-2 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all disabled:opacity-40 ${
            bracketMode
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : isBuy
                ? 'bg-profit hover:bg-profit/80 text-dark'
                : 'bg-loss hover:bg-loss/80 text-white'
          }`}
        >
          {loading ? '⏳ Placing...' : bracketMode ? '🛡 Place Bracket' : `${isBuy ? 'BUY' : 'SELL'} ${productType}`}
        </button>

      </div>
    </div>
  );
}
