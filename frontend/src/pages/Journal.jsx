import { useState, useEffect } from 'react';
import { getJournal } from '../services/api';
import { SkeletonPage } from '../components/Skeleton';
import { 
  TrendingUp, TrendingDown, Clock, Calendar, 
  BarChart2, Award, Zap, Download, ArrowUpRight, ArrowDownRight,
  Target, Shield, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { downloadTaxStatement } from '../services/api';
import { StockIcon } from '../components/StockIcon';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function Journal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [tradeSort, setTradeSort] = useState({ key: 'exitDate', dir: -1 });
  const [showAllTrades, setShowAllTrades] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getJournal();
        if (res.data && res.data.stats) {
          setStats(res.data.stats);
        } else {
          setError('Invalid data received from server');
        }
      } catch (err) {
        console.error('Failed to fetch journal', err);
        setError('Failed to load journal analytics');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <SkeletonPage type="cards" />;

  if (error || !stats) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-loss/10 rounded-full flex items-center justify-center mb-4">
        <TrendingDown className="w-8 h-8 text-loss" />
      </div>
      <h2 className="text-xl font-bold text-primary">Journal Unavailable</h2>
      <p className="text-muted mt-2 max-w-md">{error || 'Unable to load your trading analytics at this time.'}</p>
      <button 
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/80 transition-all"
      >
        Retry
      </button>
    </div>
  );

  const profitData = Object.entries(stats.profitByDay || {}).map(([day, val]) => ({
    name: day,
    profit: val
  }));

  const trades = stats.trades || [];
  const sortedTrades = [...trades].sort((a, b) => {
    const av = a[tradeSort.key];
    const bv = b[tradeSort.key];
    if (tradeSort.key === 'exitDate' || tradeSort.key === 'entryDate') {
      return (new Date(av) - new Date(bv)) * tradeSort.dir;
    }
    return ((av || 0) - (bv || 0)) * tradeSort.dir;
  });

  const displayedTrades = showAllTrades ? sortedTrades : sortedTrades.slice(0, 10);

  const toggleSort = (key) => {
    setTradeSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));
  };

  const bestDay = Object.entries(stats.profitByDay || {}).reduce(
    (best, [day, val]) => (val > best.val ? { day, val } : best),
    { day: '—', val: -Infinity }
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in p-2 md:p-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-accent" /> Trade Journal
          </h1>
          <p className="text-sm text-muted mt-1">
            Real-time P&L analytics from your matched trades
            {stats.totalTrades > 0 && (
              <span className="ml-2 text-accent text-xs font-bold bg-accent/10 px-2 py-0.5 rounded-full">
                {stats.totalTrades} round-trips
              </span>
            )}
          </p>
        </div>
        <button 
          onClick={async () => {
            setExporting(true);
            try {
              const res = await downloadTaxStatement();
              const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `Zerodha_Clone_Tax_Statement_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error('Export failed', err);
            } finally {
              setExporting(false);
            }
          }}
          disabled={exporting}
          className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/80 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : <Download className="w-4 h-4" />}
          {exporting ? 'Generating...' : 'Download Statement'}
        </button>
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard 
          label="Win Rate" 
          value={`${stats.winRate}%`} 
          sub={`${stats.wins || 0}W / ${stats.losses || 0}L`}
          icon={<Award className="w-5 h-5 text-profit" />}
          gradient="from-profit/20 to-transparent"
        />
        <MetricCard 
          label="Total P&L" 
          value={`${(stats.totalPnl || 0) >= 0 ? '+' : ''}₹${Math.abs(stats.totalPnl || 0).toLocaleString()}`}
          sub="All matched trades"
          icon={(stats.totalPnl || 0) >= 0 
            ? <TrendingUp className="w-5 h-5 text-profit" /> 
            : <TrendingDown className="w-5 h-5 text-loss" />}
          gradient={(stats.totalPnl || 0) >= 0 ? "from-profit/20 to-transparent" : "from-loss/20 to-transparent"}
          valueColor={(stats.totalPnl || 0) >= 0 ? 'text-profit' : 'text-loss'}
        />
        <MetricCard 
          label="Sharpe Ratio" 
          value={stats.sharpeRatio || '0.00'} 
          sub="Risk-adjusted Return"
          icon={<Activity className="w-5 h-5 text-cyan-500" />}
          gradient="from-cyan-500/20 to-transparent"
          valueColor={stats.sharpeRatio > 1 ? 'text-profit' : stats.sharpeRatio > 0 ? 'text-warning' : 'text-loss'}
        />
        <MetricCard 
          label="Max Drawdown" 
          value={`₹${(stats.maxDrawdown || 0).toLocaleString()}`} 
          sub="Peak to Trough"
          icon={<Shield className="w-5 h-5 text-loss" />}
          gradient="from-loss/20 to-transparent"
          valueColor="text-loss"
        />
        <MetricCard 
          label="Win Streak" 
          value={`${stats.currentStreak} 🔥`} 
          sub={`Best: ${stats.maxStreak}`}
          icon={<Zap className="w-5 h-5 text-warning" />}
          gradient="from-warning/20 to-transparent"
        />
        <MetricCard 
          label="Avg. Holding" 
          value={stats.avgHoldingTime} 
          sub="Entry to Exit"
          icon={<Clock className="w-5 h-5 text-accent" />}
          gradient="from-accent/20 to-transparent"
        />
      </div>

      {/* ── Best / Worst Trade + Day ── */}
      {(stats.bestTrade || stats.worstTrade) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.bestTrade && (
            <div className="bg-card border border-profit/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-profit/10 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-profit" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Best Trade</p>
                <p className="text-lg font-bold text-profit font-mono">+₹{stats.bestTrade.pnl.toLocaleString()}</p>
                <p className="text-xs text-secondary">{stats.bestTrade.stock} ({stats.bestTrade.pnlPercent > 0 ? '+' : ''}{stats.bestTrade.pnlPercent}%)</p>
              </div>
            </div>
          )}
          {stats.worstTrade && (
            <div className="bg-card border border-loss/20 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-loss/10 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-6 h-6 text-loss" />
              </div>
              <div>
                <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Worst Trade</p>
                <p className="text-lg font-bold text-loss font-mono">₹{stats.worstTrade.pnl.toLocaleString()}</p>
                <p className="text-xs text-secondary">{stats.worstTrade.stock} ({stats.worstTrade.pnlPercent}%)</p>
              </div>
            </div>
          )}
          <div className="bg-card border border-accent/20 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider font-bold">Best Day</p>
              <p className="text-lg font-bold text-primary">{bestDay.day}</p>
              <p className="text-xs text-profit font-mono">+₹{bestDay.val > 0 ? bestDay.val.toLocaleString() : 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Day of Week Heatmap */}
        <div className="lg:col-span-2 bg-card border border-edge rounded-2xl p-6">
          <h3 className="text-sm font-bold text-primary mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-profit" /> Daily Profit Heatmap
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={profitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-edge" />
                <XAxis dataKey="name" stroke="#6E7681" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-edge p-3 rounded-xl shadow-2xl">
                          <p className="text-xs text-secondary font-bold">{payload[0].payload.name}</p>
                          <p className={`text-sm font-mono font-bold mt-1 ${payload[0].value >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {payload[0].value >= 0 ? '+' : ''}₹{payload[0].value.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
                  {profitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#26A641' : '#F85149'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Breakdown */}
        <div className="bg-card border border-edge rounded-2xl p-6 flex flex-col">
           <h3 className="text-sm font-bold text-primary mb-6">Trading Behavior</h3>
           <div className="space-y-6 flex-1">
             {(stats.holdingStats || []).map(s => (
               <div key={s.label}>
                 <div className="flex justify-between text-xs mb-2">
                    <span className="text-muted">{s.label}</span>
                    <span className="text-primary font-bold">{s.value}</span>
                 </div>
                 <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all duration-500" 
                      style={{ width: s.value }}
                    />
                 </div>
               </div>
             ))}

             {bestDay.val > 0 && (
               <div className="mt-8 p-4 bg-surface/50 rounded-xl border border-edge">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">AI Insight</p>
                  <p className="text-xs text-primary mt-2">
                    You are most profitable on <strong className="text-accent">{bestDay.day}s</strong>.
                    {stats.winRate > 50 
                      ? ' Your win rate is above average — consider scaling positions on strong conviction trades.'
                      : ' Focus on reducing position sizes on losing streaks to protect capital.'}
                  </p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* ── Trade History Table ── */}
      {trades.length > 0 && (
        <div className="bg-card border border-edge rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-edge flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-bold text-primary">Trade History</h3>
              <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full">{trades.length} trades</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-edge text-[10px] text-muted uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Stock</th>
                  <th 
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('buyPrice')}
                  >
                    Entry {tradeSort.key === 'buyPrice' && (tradeSort.dir === 1 ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('sellPrice')}
                  >
                    Exit {tradeSort.key === 'sellPrice' && (tradeSort.dir === 1 ? '↑' : '↓')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Qty</th>
                  <th 
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('pnl')}
                  >
                    P&L {tradeSort.key === 'pnl' && (tradeSort.dir === 1 ? '↑' : '↓')}
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Hold Time</th>
                  <th 
                    className="text-right px-5 py-3 font-medium cursor-pointer hover:text-primary select-none hidden md:table-cell"
                    onClick={() => toggleSort('exitDate')}
                  >
                    Date {tradeSort.key === 'exitDate' && (tradeSort.dir === 1 ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {displayedTrades.map((t, i) => (
                  <tr key={i} className="hover:bg-surface/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <StockIcon symbol={t.stock} className="w-7 h-7" textSize="text-[9px]" />
                        <div>
                          <div className="font-semibold text-primary text-xs">{t.stock}</div>
                          <div className="text-[9px] text-muted">{t.productType || 'CNC'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-secondary">
                      ₹{t.buyPrice?.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-secondary">
                      ₹{t.sellPrice?.toFixed(2)}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-xs text-primary">
                      {t.quantity}
                    </td>
                    <td className="text-right px-4 py-3">
                      <div className={`font-semibold font-mono text-xs ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {t.pnl >= 0 ? '+' : ''}₹{t.pnl?.toLocaleString()}
                      </div>
                      <div className={`text-[9px] font-mono ${t.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {t.pnlPercent >= 0 ? '+' : ''}{t.pnlPercent}%
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-[10px] text-muted hidden md:table-cell">
                      {t.holdTime}
                    </td>
                    <td className="text-right px-5 py-3 text-[10px] text-muted hidden md:table-cell">
                      {new Date(t.exitDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {trades.length > 10 && (
            <div className="px-6 py-3 border-t border-edge text-center">
              <button 
                onClick={() => setShowAllTrades(s => !s)}
                className="text-xs text-accent hover:text-accent/80 font-bold flex items-center gap-1 mx-auto transition-colors"
              >
                {showAllTrades ? <><ChevronUp className="w-3.5 h-3.5" /> Show Less</> : <><ChevronDown className="w-3.5 h-3.5" /> Show All {trades.length} Trades</>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, icon, gradient = "", valueColor = "" }) {
  return (
    <div className={`bg-card border border-edge p-6 rounded-2xl relative overflow-hidden bg-linear-to-br ${gradient}`}>
      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
          {icon}
        </div>
        <h2 className={`text-2xl md:text-3xl font-bold mt-2 ${valueColor || 'text-primary'}`}>{value}</h2>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}
