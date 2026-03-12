import { useState, useEffect } from 'react';
import { getJournal } from '../services/api';
import { 
  TrendingUp, TrendingDown, Clock, Calendar, 
  BarChart2, Award, Zap, ChevronRight, Download
} from 'lucide-react';
import { downloadTaxStatement } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function Journal() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getJournal();
        setStats(res.data.stats);
      } catch (err) {
        console.error('Failed to fetch journal', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const profitData = Object.entries(stats.profitByDay).map(([day, val]) => ({
    name: day,
    profit: val
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-2 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Calendar className="w-6 h-6 text-accent" /> Trade Journal
          </h1>
          <p className="text-sm text-muted mt-1">Institutional-grade performance analytics</p>
        </div>
        <button 
          onClick={async () => {
            setExporting(true);
            try {
              const res = await downloadTaxStatement();
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', 'Zerodha_Clone_Tax_Statement.pdf');
              document.body.appendChild(link);
              link.click();
              link.remove();
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Win Rate" 
          value={`${stats.winRate}%`} 
          sub="Last 100 trades"
          icon={<Award className="w-5 h-5 text-profit" />}
          gradient="from-profit/20 to-transparent"
        />
        <MetricCard 
          label="Avg. Holding" 
          value={stats.avgHoldingTime} 
          sub="Entry to Exit"
          icon={<Clock className="w-5 h-5 text-accent" />}
          gradient="from-accent/20 to-transparent"
        />
        <MetricCard 
          label="Current Streak" 
          value={`${stats.currentStreak} 🔥`} 
          sub={`Max: ${stats.maxStreak}`}
          icon={<Zap className="w-5 h-5 text-warning" />}
          gradient="from-warning/20 to-transparent"
        />
        <MetricCard 
          label="Total Trades" 
          value={stats.totalTrades} 
          sub="All Time"
          icon={<BarChart2 className="w-5 h-5 text-primary" />}
        />
      </div>

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
             {stats.holdingStats.map(s => (
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

             <div className="mt-8 p-4 bg-surface/50 rounded-xl border border-edge">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Top Advice</p>
                <p className="text-xs text-primary mt-2">"You are most profitable on **Wednesdays**. Consider increasing your position sizes mid-week."</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sub, icon, gradient = "" }) {
  return (
    <div className={`bg-card border border-edge p-6 rounded-2xl relative overflow-hidden bg-linear-to-br ${gradient}`}>
      <div className="relative z-10 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{label}</span>
          {icon}
        </div>
        <h2 className="text-3xl font-bold text-primary mt-2">{value}</h2>
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      </div>
    </div>
  );
}
