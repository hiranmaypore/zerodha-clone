import { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { X, CheckCircle, AlertTriangle, TrendingDown, Target } from 'lucide-react';

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const addToast = (message, type) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev.slice(-4), { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    const onExec = (d) => addToast(`${d.type} ${d.stock} × ${d.quantity} @ ₹${d.price?.toFixed(2)}`, 'success');
    const onCancel = (d) => addToast(`${d.stock} order cancelled`, 'warning');
    const onSL = (d) => addToast(`Stop-loss: ${d.stock} @ ₹${d.executedPrice?.toFixed(2)}`, 'loss');
    const onBracket = (d) => addToast(`Bracket: ${d.stock} @ ₹${d.entryPrice?.toFixed(2)}`, 'success');

    socket.on('order_executed', onExec);
    socket.on('order_cancelled', onCancel);
    socket.on('stop_loss_triggered', onSL);
    socket.on('bracket_entry_executed', onBracket);

    return () => {
      socket.off('order_executed', onExec);
      socket.off('order_cancelled', onCancel);
      socket.off('stop_loss_triggered', onSL);
      socket.off('bracket_entry_executed', onBracket);
    };
  }, []);

  const iconMap = {
    success: <CheckCircle className="w-4 h-4 text-profit" />,
    warning: <AlertTriangle className="w-4 h-4 text-warning" />,
    loss: <TrendingDown className="w-4 h-4 text-loss" />,
    info: <Target className="w-4 h-4 text-accent" />,
  };

  const borderMap = {
    success: 'border-l-profit',
    warning: 'border-l-warning',
    loss: 'border-l-loss',
    info: 'border-l-accent',
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 bg-card border-l-4 ${borderMap[toast.type]} rounded-lg shadow-2xl animate-slide-in`}
        >
          {iconMap[toast.type]}
          <span className="text-sm text-primary flex-1">{toast.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="text-muted hover:text-primary cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
