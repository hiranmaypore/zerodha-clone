import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders, cancelOrder } from '../services/api';
import {
  ShoppingCart, X, Clock, CheckCircle, XCircle,
  RefreshCw, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  AlertCircle, Zap
} from 'lucide-react';
import { StockIcon } from '../components/StockIcon';

const FILTERS = ['ALL', 'PENDING', 'GTT', 'COMPLETED', 'CANCELLED'];

const STATUS_CFG = {
  COMPLETED:  { icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-profit',   bg: 'bg-profit/10',   label: 'Completed' },
  PENDING:    { icon: <Clock       className="w-3.5 h-3.5" />, color: 'text-warning',  bg: 'bg-warning/10',  label: 'Pending'   },
  GTT_ACTIVE: { icon: <Zap         className="w-3.5 h-3.5" />, color: 'text-accent',   bg: 'bg-accent/10',   label: 'GTT Active' },
  CANCELLED:  { icon: <XCircle     className="w-3.5 h-3.5" />, color: 'text-loss',     bg: 'bg-loss/10',     label: 'Cancelled' },
  FAILED:     { icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-muted',    bg: 'bg-surface',     label: 'Failed'    },
  REJECTED:   { icon: <XCircle     className="w-3.5 h-3.5" />, color: 'text-muted',    bg: 'bg-surface',     label: 'Rejected'  },
};

const PRODUCT_CFG = {
  CNC: { label: 'CNC', cls: 'bg-accent/10 text-accent' },
  MIS: { label: 'MIS', cls: 'bg-warning/20 text-warning' },
};

const CATEGORY_CFG = {
  BRACKET:  { label: '🛡 Bracket',  cls: 'bg-purple-500/10 text-purple-300' },
  STOPLOSS: { label: '⚡ Stop-Loss', cls: 'bg-loss/10 text-loss'             },
};

export default function Orders() {
  const navigate  = useNavigate();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [cancelling, setCancelling] = useState(null); // id being cancelled
  const [toast,   setToast]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrders();
      const list = Array.isArray(res.data) ? res.data : res.data?.orders || [];
      setOrders(list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await cancelOrder(id);
      showToast('✅ Order cancelled successfully', 'success');
      await load();
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Cancel failed', 'error');
    } finally {
      setCancelling(null);
    }
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = filter === 'ALL' 
    ? orders 
    : filter === 'GTT' 
      ? orders.filter(o => o.isGTT)
      : orders.filter(o => o.status === filter && !o.isGTT);

  // ── Stats ──────────────────────────────────────────────────
  const total     = orders.length;
  const completed = orders.filter(o => o.status === 'COMPLETED').length;
  const pending   = orders.filter(o => o.status === 'PENDING').length;
  const gtt       = orders.filter(o => o.isGTT).length;
  const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
  const totalVolume = orders
    .filter(o => o.status === 'COMPLETED')
    .reduce((s, o) => s + (o.price * o.quantity), 0);

  const fmt = (n) =>
    n >= 1e5 ? `₹${(n / 1e5).toFixed(2)}L` :
    n >= 1e3 ? `₹${(n / 1e3).toFixed(1)}K` :
    `₹${n.toFixed(2)}`;

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-fade-in
          ${toast.type === 'success' ? 'bg-profit/10 border-profit/20 text-profit'
          : toast.type === 'error'   ? 'bg-loss/10   border-loss/20   text-loss'
          :                            'bg-card       border-edge       text-primary'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          <p className="text-sm text-muted mt-0.5">{total} total · {pending} pending · {gtt} GTT</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs text-secondary hover:text-primary transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',     value: total,         color: 'text-primary',  icon: <ShoppingCart className="w-4 h-4"/> },
          { label: 'Completed', value: completed,     color: 'text-profit',   icon: <CheckCircle  className="w-4 h-4"/> },
          { label: 'Pending',   value: pending,       color: 'text-warning',  icon: <Clock        className="w-4 h-4"/> },
          { label: 'GTT Triggers', value: gtt,        color: 'text-accent',   icon: <Zap          className="w-4 h-4"/> },
          { label: 'Cancelled', value: cancelled,     color: 'text-loss',     icon: <XCircle      className="w-4 h-4"/> },
          { label: 'Volume',    value: fmt(totalVolume), color: 'text-accent', icon: <ArrowUpRight className="w-4 h-4"/> },
        ].map(c => (
          <div key={c.label} className="bg-card border border-edge rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted uppercase tracking-wide">{c.label}</span>
              <span className={c.color}>{c.icon}</span>
            </div>
            <div className={`text-xl font-bold font-mono ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* ── Filter pills ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => {
          const cnt = f === 'ALL' ? total 
            : f === 'GTT' ? gtt
            : orders.filter(o => o.status === f && !o.isGTT).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5
                ${filter === f
                  ? 'bg-accent text-white shadow-sm shadow-accent/25'
                  : 'bg-card border border-edge text-secondary hover:text-primary'}`}
            >
              {f}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono
                ${filter === f ? 'bg-white/20' : 'bg-surface text-muted'}`}>
                {cnt}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Orders table ── */}
      <div className="bg-card border border-edge rounded-xl overflow-hidden">
        {filtered.length > 0 ? (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-12 px-2 md:px-5 py-2.5 text-[10px] text-muted uppercase tracking-wide border-b border-edge font-medium">
              <div className="col-span-2 md:col-span-1 text-center md:text-left">Type</div>
              <div className="col-span-4 md:col-span-2">Stock</div>
              <div className="col-span-2 hidden md:block">Order Details</div>
              <div className="col-span-1 text-center hidden sm:block">Product</div>
              <div className="col-span-2 md:col-span-1 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1 text-right hidden sm:block">Total</div>
              <div className="col-span-2 md:col-span-1 text-center">Status</div>
              <div className="col-span-1 text-right hidden md:block">Time</div>
            </div>

            <div className="divide-y divide-edge">
              {filtered.map(order => {
                const cfg  = STATUS_CFG[order.status] || STATUS_CFG.FAILED;
                const isBuy = order.type === 'BUY';
                const total = (order.price || 0) * (order.quantity || 0);

                return (
                  <div
                    key={order._id}
                    className="grid grid-cols-12 px-2 md:px-5 py-3.5 items-center hover:bg-surface/60 transition-colors group"
                  >
                    {/* BUY/SELL badge */}
                    <div className="col-span-2 md:col-span-1 flex items-center justify-center md:justify-start">
                      <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold
                        ${isBuy ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                        {isBuy ? <TrendingUp className="w-2 h-2 md:w-2.5 md:h-2.5" /> : <TrendingDown className="w-2 h-2 md:w-2.5 md:h-2.5" />}
                        {order.type}
                      </span>
                    </div>

                    {/* Stock */}
                    <div
                      className="col-span-4 md:col-span-2 flex items-center gap-1.5 md:gap-2.5 cursor-pointer"
                      onClick={() => navigate(`/dashboard?stock=${order.stock}`)}
                    >
                      <StockIcon symbol={order.stock} className="w-6 h-6 md:w-7 md:h-7" textSize="text-[8px] md:text-[10px]" />
                      <div className="min-w-0">
                        <div className="font-semibold text-xs md:text-sm text-primary group-hover:text-accent transition-colors truncate">
                          {order.stock}
                        </div>
                        <div className="md:hidden text-[8px] text-muted">
                           {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {/* Order details: type + category + prices + cancel reason */}
                    <div className="col-span-2 hidden md:block space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted">{order.isGTT ? 'GTT Trigger' : order.orderType || 'MARKET'}</span>
                        {CATEGORY_CFG[order.orderCategory] && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_CFG[order.orderCategory].cls}`}>
                            {CATEGORY_CFG[order.orderCategory].label}
                          </span>
                        )}
                        {order.isGTT && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-warning/10 text-warning">
                                📋 GTT
                            </span>
                        )}
                      </div>
                      {order.isGTT ? (
                          <div className="text-[10px] text-warning font-mono font-bold">Trigger @ ₹{order.triggerPrice}</div>
                      ) : order.limitPrice && (
                        <div className="text-[10px] text-secondary font-mono">@ ₹{order.limitPrice}</div>
                      )}
                      {order.stopLossPrice && (
                        <div className="text-[10px] text-loss font-mono">SL ₹{order.stopLossPrice}</div>
                      )}
                      {order.targetPrice && (
                        <div className="text-[10px] text-profit font-mono">TGT ₹{order.targetPrice}</div>
                      )}
                      {order.cancelReason && (
                        <div className="text-[9px] text-muted/60 truncate max-w-[140px]" title={order.cancelReason}>
                          {order.cancelReason}
                        </div>
                      )}
                      {order.isGTT && !order.cancelReason && order.expiryDate && (
                          <div className="text-[8px] text-muted italic">
                              Expires {new Date(order.expiryDate).toLocaleDateString()}
                          </div>
                      )}
                    </div>

                    {/* Product type pill (CNC / MIS) */}
                    <div className="col-span-1 hidden sm:flex justify-center items-start pt-1">
                      {order.productType && (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          (PRODUCT_CFG[order.productType] || PRODUCT_CFG.CNC).cls
                        }`}>
                          {order.productType}
                        </span>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="col-span-2 md:col-span-1 text-right font-mono text-xs md:text-sm text-primary pr-1">
                      {order.quantity}
                    </div>

                    {/* Price */}
                    <div className="col-span-2 text-right">
                      <div className="font-mono font-semibold text-xs md:text-sm text-primary">
                        ₹{order.price?.toFixed(2)}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="col-span-1 text-right hidden sm:block">
                      <div className="font-mono text-sm text-secondary">{fmt(total)}</div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      <span className={`inline-flex items-center gap-1 px-1.5 md:px-2 py-1 rounded-full text-[8px] md:text-[10px] font-semibold flex-col md:flex-row text-center ${cfg.color} ${cfg.bg}`}>
                        {cfg.icon} <span className="hidden md:inline">{cfg.label}</span>
                      </span>
                    </div>

                    {/* Time + Cancel */}
                    <div className="col-span-12 md:col-span-1 text-right flex items-center justify-end gap-1 mt-2 md:mt-0">
                      <div className="hidden md:block text-[10px] text-muted leading-tight text-right">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        <br />
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {(order.status === 'PENDING' || order.status === 'GTT_ACTIVE') && (
                        <button
                          onClick={() => handleCancel(order._id)}
                          disabled={cancelling === order._id}
                          title="Cancel order"
                          className="w-full md:w-auto ml-1 p-1.5 rounded-lg text-loss hover:text-loss hover:bg-loss/10 transition-all disabled:opacity-40 border border-loss/20 md:border-transparent text-xs text-center flex justify-center items-center"
                        >
                          {cancelling === order._id
                            ? <div className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                            : <><X className="w-3.5 h-3.5" /> <span className="md:hidden">Cancel</span></>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-20 text-center space-y-3">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted/20" />
            <p className="text-primary font-semibold">No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders</p>
            <p className="text-sm text-muted">Place orders from the dashboard</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
