import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../../services/api';
import { getSocket } from '../../services/socket';
import { StockIcon } from '../StockIcon';

export default function RunningTrades({ selectedStock, livePrices }) {
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await getOrders();
        const data = Array.isArray(res.data) ? res.data : res.data?.orders || [];
        const completed = data.filter(o => o.status === 'COMPLETED').slice(0, 8);
        setTrades(completed);
      } catch {
        // fallback - empty
      }
    };
    fetchTrades();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (order) => {
      if (order.status === 'COMPLETED') {
        setTrades(prev => [order, ...prev].slice(0, 8));
      }
    };
    socket.on('order_filled', handler);
    socket.on('order_executed', handler);
    return () => {
      socket.off('order_filled', handler);
      socket.off('order_executed', handler);
    };
  }, []);

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
        <span className="text-sm font-semibold text-primary">Recent Trades</span>
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          See All
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 flex items-center text-[10px] text-muted border-b border-edge/50">
        <span className="flex-1">Stock</span>
        <span className="flex-1 text-center">Price</span>
        <span className="flex-1 text-right">Time</span>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {trades.length > 0 ? (
          trades.map((trade, i) => (
            <div key={trade._id || i} className="px-4 py-2 flex items-center text-xs hover:bg-hover/50 transition-colors">
              <span className="flex-1 flex items-center gap-1.5 font-semibold text-primary truncate mr-2">
                <StockIcon symbol={trade.stock} className="w-3.5 h-3.5 shrink-0" textSize="text-[6px]" />
                <span className="truncate">{trade.stock}</span>
              </span>
              <span className={`flex-1 text-center font-mono ${trade.type === 'BUY' ? 'text-profit' : 'text-loss'}`}>
                ₹{trade.price?.toFixed(2)}
              </span>
              <span className="flex-1 text-right text-muted font-mono">
                {new Date(trade.createdAt).toLocaleTimeString('en-IN', { hour12: false })}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-muted text-xs">No recent trades</div>
        )}
      </div>
    </div>
  );
}
