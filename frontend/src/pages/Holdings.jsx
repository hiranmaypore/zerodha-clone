import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHoldings } from '../services/api';
import { connectSocket } from '../services/socket';
import { TrendingUp, TrendingDown, Briefcase } from 'lucide-react';

export default function Holdings() {
  const navigate = useNavigate();
  const [holdings, setHoldings] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHoldings();
    const socket = connectSocket();
    socket.on('price_update', setPrices);
    return () => socket.off('price_update');
  }, []);

  const loadHoldings = async () => {
    try {
      const res = await getHoldings();
      setHoldings(res.data.holdings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate with live prices
  const enriched = holdings.map(h => {
    const livePrice = prices[h.stock] || h.currentPrice;
    const currentValue = livePrice * h.quantity;
    const pnl = currentValue - h.investedValue;
    const pnlPercent = h.investedValue > 0 ? (pnl / h.investedValue) * 100 : 0;
    return { ...h, currentPrice: livePrice, currentValue, pnl, pnlPercent };
  });

  const totalInvested = enriched.reduce((a, h) => a + h.investedValue, 0);
  const totalCurrent = enriched.reduce((a, h) => a + h.currentValue, 0);
  const totalPnl = totalCurrent - totalInvested;
  const totalPnlPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-primary">Holdings</h1>
        <p className="text-secondary text-sm mt-1">{enriched.length} stocks in portfolio</p>
      </div>

      {/* Summary Bar */}
      {enriched.length > 0 && (
        <div className="bg-card border border-edge rounded-xl p-5 flex flex-wrap gap-8">
          <div>
            <p className="text-xs text-secondary mb-1">Total Invested</p>
            <p className="text-lg font-bold text-primary">₹{totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-secondary mb-1">Current Value</p>
            <p className="text-lg font-bold text-primary">₹{totalCurrent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-secondary mb-1">Total P&L</p>
            <p className={`text-lg font-bold ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalPnl >= 0 ? '+' : ''}₹{totalPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              <span className="text-sm ml-1">({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)</span>
            </p>
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-card border border-edge rounded-xl overflow-hidden">
        {enriched.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-edge text-xs text-secondary">
                <th className="text-left px-5 py-3 font-medium">Stock</th>
                <th className="text-right px-5 py-3 font-medium">Qty</th>
                <th className="text-right px-5 py-3 font-medium">Avg Price</th>
                <th className="text-right px-5 py-3 font-medium">LTP</th>
                <th className="text-right px-5 py-3 font-medium">Invested</th>
                <th className="text-right px-5 py-3 font-medium">Current</th>
                <th className="text-right px-5 py-3 font-medium">P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {enriched.map(h => (
                <tr
                  key={h._id}
                  onClick={() => navigate(`/dashboard?stock=${h.stock}`)}
                  className="hover:bg-hover transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-primary">{h.stock}</p>
                    <p className="text-xs text-muted">{h.name}</p>
                  </td>
                  <td className="text-right px-5 py-3 text-sm text-primary">{h.quantity}</td>
                  <td className="text-right px-5 py-3 text-sm text-primary">₹{h.avgPrice?.toFixed(2)}</td>
                  <td className="text-right px-5 py-3 text-sm font-medium text-primary">₹{h.currentPrice?.toFixed(2)}</td>
                  <td className="text-right px-5 py-3 text-sm text-secondary">₹{h.investedValue?.toFixed(2)}</td>
                  <td className="text-right px-5 py-3 text-sm text-primary">₹{h.currentValue?.toFixed(2)}</td>
                  <td className="text-right px-5 py-3">
                    <p className={`text-sm font-medium ${h.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {h.pnl >= 0 ? '+' : ''}₹{h.pnl?.toFixed(2)}
                    </p>
                    <p className={`text-xs ${h.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {h.pnlPercent >= 0 ? '+' : ''}{h.pnlPercent?.toFixed(2)}%
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-muted text-sm">
            <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-50" />
            No holdings yet. Buy stocks from the Market page!
          </div>
        )}
      </div>
    </div>
  );
}
