import { useState } from 'react';
import { ClipboardList, X, CheckCircle, Clock, XCircle, ChevronDown } from 'lucide-react';

const STATUS_MAP = {
  PENDING:   { label: 'Pending',   cls: 'text-warning bg-warning/10',   icon: <Clock className="w-3 h-3" /> },
  COMPLETED: { label: 'Executed',  cls: 'text-profit bg-profit/10',    icon: <CheckCircle className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', cls: 'text-muted bg-surface',        icon: <XCircle className="w-3 h-3" /> },
  REJECTED:  { label: 'Rejected',  cls: 'text-loss bg-loss/10',         icon: <XCircle className="w-3 h-3" /> },
};

export default function ActiveOrders({ orders = [], onCancel }) {
  const [filter, setFilter] = useState('ALL');

  const filtered = filter === 'ALL'
    ? orders
    : orders.filter(o => o.status === filter);

  const filtersConfig = [
    { label: 'All', value: 'ALL',      count: orders.length },
    { label: 'Pending', value: 'PENDING',   count: orders.filter(o => o.status === 'PENDING').length },
    { label: 'Executed', value: 'COMPLETED', count: orders.filter(o => o.status === 'COMPLETED').length },
    { label: 'Cancelled', value: 'CANCELLED', count: orders.filter(o => o.status === 'CANCELLED').length },
  ];

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-edge flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs font-semibold text-primary">Orders</span>
          <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded-full">{orders.length}</span>
        </div>
        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {filtersConfig.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                filter === f.value
                  ? 'bg-accent text-dark'
                  : 'text-muted hover:text-primary'
              }`}
            >
              {f.label}
              {f.count > 0 && <span className="ml-1 opacity-70">{f.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-6 gap-2">
            <ClipboardList className="w-7 h-7 text-muted/30" />
            <p className="text-xs text-muted">No {filter === 'ALL' ? '' : filter.toLowerCase()} orders</p>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-edge bg-surface/50">
                {['Stock', 'Type', 'Order', 'Qty', 'Price', 'Status', ''].map(h => (
                  <th key={h} className="px-3 py-2 text-left text-muted font-medium text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => {
                const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                return (
                  <tr key={order._id} className="border-b border-edge/50 hover:bg-surface/40 transition-colors">
                    <td className="px-3 py-2 font-bold text-primary">{order.stock}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        order.type === 'BUY' ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
                      }`}>{order.type}</span>
                    </td>
                    <td className="px-3 py-2 text-muted">{order.orderType || 'MKT'}</td>
                    <td className="px-3 py-2 font-mono">{order.quantity}</td>
                    <td className="px-3 py-2 font-mono text-secondary">
                      ₹{(order.price || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>
                        {st.icon}{st.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {order.status === 'PENDING' && onCancel && (
                        <button
                          onClick={() => onCancel(order._id)}
                          className="text-muted hover:text-loss transition-colors p-1 rounded hover:bg-loss/10"
                          title="Cancel order"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
