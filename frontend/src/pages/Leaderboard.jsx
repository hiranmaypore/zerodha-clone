import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
import { 
  Trophy, Medal, Target as TargetIcon, ArrowUpRight, TrendingUp, TrendingDown, Users, Search 
} from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getLeaderboard();
        setLeaderboard(res.data.leaderboard);
      } catch (err) {
        console.error('Failed to fetch leaderboard', err);
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

  const filtered = leaderboard.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-2 md:p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" /> Hall of Fame
          </h1>
          <p className="text-sm text-muted mt-1">Global rankings by ROI (Net Worth vs. Initial ₹1 Lakh)</p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input 
            type="text" 
            placeholder="Search trader..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-edge rounded-xl focus:border-accent outline-none text-primary placeholder-muted"
          />
        </div>
      </div>

      {/* ── Top 3 podium ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {leaderboard.slice(0, 3).map((u, i) => (
          <div key={u.name} className={`relative bg-card border border-edge p-6 rounded-2xl overflow-hidden group hover:border-accent/50 transition-all ${i === 0 ? 'ring-2 ring-warning/30' : ''}`}>
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className={`w-20 h-20 ${i === 0 ? 'text-warning' : i === 1 ? 'text-silver' : 'text-amber-800'}`} />
             </div>
             <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                   i === 0 ? 'bg-warning text-dark' : i === 1 ? 'bg-gray-400 text-dark' : 'bg-amber-800 text-white'
                }`}>
                   {i + 1}
                </div>
                <div>
                   <h3 className="text-lg font-bold text-primary">{u.name}</h3>
                   <div className="flex gap-1.5 mt-1 flex-wrap">
                      {u.badges.map(b => (
                         <span key={b} className="px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-[9px] font-bold text-accent uppercase tracking-wider">{b}</span>
                      ))}
                   </div>
                </div>
             </div>
             <div className="mt-8 flex justify-between items-end">
                <div>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total ROI</p>
                   <p className={`text-2xl font-mono font-bold ${u.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {u.roi >= 0 ? '+' : ''}{u.roi}%
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Net Worth</p>
                   <p className="text-sm font-bold text-primary">₹{u.netWorth.toLocaleString()}</p>
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* ── All Traders Table ── */}
      <div className="bg-card border border-edge rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface/50 border-b border-edge">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Rank</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Trader</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">ROI (%)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Net Worth</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Trades</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Specialization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {filtered.map((u, i) => (
                <tr key={u.name} className="hover:bg-surface/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${i < 3 ? 'text-accent' : 'text-muted'}`}>#{i + 1}</span>
                  </td>
                  <td className="px-6 py-4 min-w-[200px]">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-linear-to-br from-accent/40 to-indigo-600/40 flex items-center justify-center text-xs font-bold text-primary shadow-sm group-hover:scale-110 transition-transform">
                          {u.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-primary">{u.name}</p>
                          <p className="text-[10px] text-muted-foreground">Level {Math.floor(u.tradeCount / 10) + 1} Trader</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${u.roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                       {u.roi >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                       {u.roi >= 0 ? '+' : ''}{u.roi}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono font-bold text-primary">₹{u.netWorth.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-secondary font-medium">
                    {u.tradeCount}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                       {u.badges.slice(0, 2).map(b => (
                          <span key={b} className="px-1.5 py-0.5 rounded bg-surface border border-edge text-[9px] font-bold text-muted group-hover:text-accent group-hover:border-accent/30 transition-colors">{b}</span>
                       ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
