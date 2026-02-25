import { useState, useEffect } from 'react';
import { getOrders, cancelOrder } from '../services/api';
import { ShoppingCart, X, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [toast, setToast] = useState(null);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id);
      setToast('Order cancelled');
      loadOrders();
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast(err.response?.data?.message || 'Cancel failed');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const filtered = filter === 'ALL' ? orders : orders.filter(o => o.status === filter);

  const statusIcon = {
    COMPLETED: <CheckCircle className="w-4 h-4 text-profit" />,
    PENDING: <Clock className="w-4 h-4 text-warning" />,
    CANCELLED: <XCircle className="w-4 h-4 text-loss" />,
    FAILED: <XCircle className="w-4 h-4 text-muted" />,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Orders</h1>
          <p className="text-secondary text-sm mt-1">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'COMPLETED', 'CANCELLED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer
                ${filter === f ? 'bg-accent text-white' : 'bg-card text-secondary border border-edge hover:text-primary'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-card border border-edge rounded-lg shadow-2xl text-sm text-primary animate-slide-in">
          {toast}
        </div>
      )}

      <div className="bg-card border border-edge rounded-xl overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-edge">
            {filtered.map(order => (
              <div key={order._id} className="px-5 py-4 flex items-center justify-between hover:bg-hover transition-colors">
                <div className="flex items-center gap-4">
                  {statusIcon[order.status]}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold
                        ${order.type === 'BUY' ? 'bg-profit-dim text-profit' : 'bg-loss-dim text-loss'}`}>
                        {order.type}
                      </span>
                      <span className="text-sm font-semibold text-primary">{order.stock}</span>
                      {order.orderCategory && order.orderCategory !== 'REGULAR' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent/10 text-accent font-medium">
                          {order.orderCategory}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1">
                      {order.quantity} shares · {order.orderType}
                      {order.limitPrice ? ` @ ₹${order.limitPrice}` : ''}
                      {order.stopLossPrice ? ` · SL: ₹${order.stopLossPrice}` : ''}
                      {order.targetPrice ? ` · Target: ₹${order.targetPrice}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-primary">₹{order.price?.toFixed(2)}</p>
                    <p className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(order._id)}
                      className="p-2 rounded-lg text-muted hover:text-loss hover:bg-loss-dim transition-all cursor-pointer"
                      title="Cancel order"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-muted text-sm">
            <ShoppingCart className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No {filter !== 'ALL' ? filter.toLowerCase() : ''} orders found
          </div>
        )}
      </div>
    </div>
  );
}
