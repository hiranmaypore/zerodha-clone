import { useState, useEffect } from 'react';
import { Bell, BellRing, Trash2, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { getAlerts, createAlert, deleteAlert } from '../../services/api';
import { getSocket } from '../../services/socket';
import { StockIcon } from '../StockIcon';

export default function AlertsPanel({ selectedStock, currentPrice }) {
  const [alerts, setAlerts] = useState([]);
  const [condition, setCondition] = useState('ABOVE');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAlerts();
    const socket = getSocket();
    if (!socket) return;
    
    // Refresh alerts when one triggers
    const triggerHander = (notif) => {
      // Small timeout to allow DB to save the triggered state
      if (notif.title === 'Price Alert') {
        setTimeout(fetchAlerts, 500); 
      }
    };
    socket.on('notification', triggerHander);
    return () => socket.off('notification', triggerHander);
  }, []);

  // Pre-fill target price
  useEffect(() => {
    if (currentPrice) {
      setTargetPrice(currentPrice.toFixed(2));
    }
  }, [selectedStock, currentPrice]);

  const fetchAlerts = async () => {
    try {
      const { data } = await getAlerts();
      setAlerts(data.alerts || []);
    } catch {
      // ignore
    }

  };

  const handleCreate = async () => {
    if (!selectedStock || !targetPrice) return;
    setLoading(true);
    setError(null);
    try {
      await createAlert({
        stock: selectedStock.symbol,
        condition,
        targetPrice: parseFloat(targetPrice)
      });
      await fetchAlerts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAlert(id);
      setAlerts(prev => prev.filter(a => a._id !== id));
    } catch {
      // ignore
    }

  };

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col overflow-hidden h-full">
      {/* ── Header ── */}
      <div className="px-4 py-3 border-b border-edge flex items-center justify-between bg-surface/30">
        <div className="flex items-center gap-2">
          <BellRing className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-primary">Price Alerts</span>
        </div>
      </div>

      {/* ── Create Alert Form ── */}
      <div className="p-4 border-b border-edge space-y-3 bg-surface/10">
        <div className="flex items-center gap-2">
          <StockIcon symbol={selectedStock?.symbol} className="w-5 h-5 shrink-0" textSize="text-[8px]" />
          <span className="text-sm font-bold text-primary truncate">
            {selectedStock?.symbol || 'Select a stock'}
          </span>
          <span className="ml-auto text-xs font-mono text-muted">LTP ₹{currentPrice?.toFixed(2) || '0.00'}</span>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={condition} 
            onChange={(e) => setCondition(e.target.value)}
            className="flex-1 bg-surface border border-edge rounded-lg px-2 py-1.5 text-xs text-primary font-medium outline-none"
            disabled={!selectedStock}
          >
            <option value="ABOVE">Crosses Above</option>
            <option value="BELOW">Crosses Below</option>
          </select>
          <input 
            type="number" 
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="₹ Target"
            className="flex-1 bg-surface border border-edge rounded-lg px-3 py-1.5 text-xs font-mono text-primary outline-none focus:border-accent"
            disabled={!selectedStock}
          />
        </div>
        
        {error && <div className="text-[10px] text-loss">{error}</div>}
        
        <button 
          onClick={handleCreate}
          disabled={!selectedStock || loading}
          className="w-full py-1.5 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors text-xs font-bold rounded-lg flex justify-center items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          Set Alert
        </button>
      </div>

      {/* ── Alert List ── */}
      <div className="flex-1 overflow-y-auto min-h-[120px]">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div key={alert._id} className={`px-4 py-2.5 border-b border-edge/50 flex items-center justify-between text-xs transition-colors hover:bg-surface/40 ${!alert.isActive ? 'opacity-50' : ''}`}>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-primary mb-0.5">
                  <span>{alert.stock}</span>
                  {alert.condition === 'ABOVE' 
                    ? <ArrowUpRight className="w-3 h-3 text-profit" /> 
                    : <ArrowDownRight className="w-3 h-3 text-loss" />}
                  <span className="font-mono">₹{alert.targetPrice}</span>
                </div>
                <div className="text-[10px] text-muted">
                  {alert.isActive ? 'Active' : `Triggered ${new Date(alert.triggeredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
                </div>
              </div>
              
              <button 
                onClick={() => handleDelete(alert._id)}
                className="p-1.5 text-muted hover:text-loss transition-colors rounded-lg hover:bg-loss/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-muted gap-2 opacity-60">
            <Bell className="w-8 h-8" />
            <span className="text-[10px]">No active alerts</span>
          </div>
        )}
      </div>
    </div>
  );
}
