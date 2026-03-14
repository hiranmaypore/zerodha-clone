import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/api';
import { SkeletonPage } from '../components/Skeleton';
import { 
  Trophy, Search, 
  TrendingUp, TrendingDown, Medal, Star, Flame, Crown,
  ArrowUp, ArrowDown, Minus, Calendar
} from 'lucide-react';

// Achievement badge configs
const BADGE_ICONS = {
  'The Wizard': { icon: '🧙', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'Consistent Gainer': { icon: '📈', color: 'bg-profit/10 text-profit border-profit/20' },
  'Scalping Specialist': { icon: '⚡', color: 'bg-warning/10 text-warning border-warning/20' },
  'Active Trader': { icon: '🔥', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'Whale': { icon: '🐋', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  'Diamond Hands': { icon: '💎', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  'Top 3': { icon: '🏆', color: 'bg-warning/10 text-warning border-warning/20' },
};

const RANK_COLORS = ['text-warning', 'text-gray-400', 'text-amber-700'];
const PODIUM_MEDAL = [Crown, Medal, Star];

// Generate avatar colors based on name
function getAvatarGradient(name) {
  const colors = [
    'from-purple-500 to-indigo-500',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-pink-500',
    'from-violet-500 to-fuchsia-500',
  ];
  const idx = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length;
  return colors[idx];
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'weekly' | 'monthly'

  const fetchData = async () => {
    try {
      const leaderRes = await getLeaderboard();
      // Add simulated rank changes and weekly/monthly variations
      const lb = (leaderRes.data.leaderboard || []).map((u, i) => ({
        ...u,
        rank: i + 1,
        rankChange: Math.floor(Math.random() * 5) - 2, // -2 to +2
        weeklyRoi: parseFloat((u.roi * (0.05 + Math.random() * 0.15)).toFixed(2)),
        monthlyRoi: parseFloat((u.roi * (0.2 + Math.random() * 0.4)).toFixed(2)),
        avatar: getAvatarGradient(u.name),
        winRate: Math.min(85, Math.max(35, 50 + Math.random() * 30)).toFixed(0),
      }));
      setLeaderboard(lb);
    } catch {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <SkeletonPage type="list" />;

  const filtered = leaderboard.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));
  
  const getRoi = (u) => {
    if (timeframe === 'weekly') return u.weeklyRoi;
    if (timeframe === 'monthly') return u.monthlyRoi;
    return u.roi;
  };

  const sorted = [...filtered].sort((a, b) => getRoi(b) - getRoi(a));

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fade-in p-2 md:p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" /> Hall of Fame
          </h1>
          <p className="text-sm text-muted mt-1">Global rankings by ROI (Net Worth vs. Initial ₹1 Lakh)</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Timeframe Tabs */}
          <div className="flex gap-1 bg-surface/50 p-1 rounded-xl border border-edge">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'monthly', label: 'Monthly' },
              { key: 'weekly', label: 'Weekly' },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTimeframe(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  timeframe === t.key ? 'bg-accent text-white shadow' : 'text-muted hover:text-primary'
                }`}
              >
                {t.label}
              </button>
            ))}
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
      </div>

      {/* ── Top 3 podium ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sorted.slice(0, 3).map((u, i) => {
          const PodiumIcon = PODIUM_MEDAL[i];
          const roi = getRoi(u);
          return (
            <div key={u.userId || u.name} className={`relative bg-card border border-edge p-6 rounded-2xl overflow-hidden group hover:border-accent/50 transition-all ${i === 0 ? 'ring-2 ring-warning/30' : ''}`}>
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Trophy className={`w-20 h-20 ${i === 0 ? 'text-warning' : i === 1 ? 'text-gray-400' : 'text-amber-800'}`} />
               </div>
               
               <div className="flex items-center justify-between relative z-10 mb-6">
                  <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-linear-to-br ${u.avatar} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                          {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-primary">{u.name}</h3>
                            <RankChange change={u.rankChange} />
                          </div>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                              {u.badges.map(b => {
                                const cfg = BADGE_ICONS[b] || { icon: '⭐', color: 'bg-surface text-muted border-edge' };
                                return (
                                  <span key={b} className={`px-2 py-0.5 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${cfg.color}`}>
                                    <span>{cfg.icon}</span>{b}
                                  </span>
                                );
                              })}
                          </div>
                      </div>
                  </div>
               </div>

               <div className="flex justify-between items-end">
                  <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                       {timeframe === 'weekly' ? 'Weekly' : timeframe === 'monthly' ? 'Monthly' : 'Total'} ROI
                     </p>
                     <p className={`text-2xl font-mono font-bold ${roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {roi >= 0 ? '+' : ''}{roi}%
                     </p>
                  </div>
                  <div className="text-right space-y-1">
                     <div>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Net Worth</p>
                       <p className="text-sm font-bold text-primary">₹{u.netWorth.toLocaleString()}</p>
                     </div>
                     <div>
                       <p className="text-[9px] text-muted">Win Rate: <span className="text-profit font-bold">{u.winRate}%</span></p>
                     </div>
                  </div>
               </div>

               {/* Rank badge */}
               <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                 i === 0 ? 'bg-warning' : i === 1 ? 'bg-gray-400' : 'bg-amber-800'
               }`}>
                 <PodiumIcon className="w-4 h-4 text-black" />
               </div>
            </div>
          );
        })}
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
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest hidden md:table-cell">Win Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest hidden md:table-cell">Trades</th>
                <th className="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Net Worth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {sorted.map((u, i) => {
                const roi = getRoi(u);
                return (
                  <tr key={u.userId || u.name} className="hover:bg-surface/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${i < 3 ? RANK_COLORS[i] : 'text-muted'}`}>#{i + 1}</span>
                        <RankChange change={u.rankChange} />
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                         <div className={`w-9 h-9 rounded-xl bg-linear-to-br ${u.avatar} flex items-center justify-center text-sm font-bold text-white shadow-sm group-hover:scale-110 transition-transform`}>
                            {u.name.charAt(0).toUpperCase()}
                         </div>
                         <div>
                            <p className="text-sm font-bold text-primary">{u.name}</p>
                            <div className="flex gap-1 mt-0.5">
                               {u.badges.slice(0, 2).map(b => {
                                 const cfg = BADGE_ICONS[b] || { icon: '⭐', color: 'bg-surface text-muted border-edge' };
                                 return <span key={b} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${cfg.color}`}>{cfg.icon} {b}</span>;
                               })}
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${roi >= 0 ? 'text-profit' : 'text-loss'}`}>
                         {roi >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                         {roi >= 0 ? '+' : ''}{roi}%
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div className="h-full bg-profit rounded-full" style={{ width: `${u.winRate}%` }} />
                        </div>
                        <span className="text-xs text-muted font-mono">{u.winRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-xs text-muted font-mono">{u.tradeCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-mono font-bold text-primary">₹{u.netWorth.toLocaleString()}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RankChange({ change }) {
  if (change === 0) return <Minus className="w-3 h-3 text-muted/30" />;
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-[9px] text-profit font-bold">
      <ArrowUp className="w-3 h-3" />{change}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-[9px] text-loss font-bold">
      <ArrowDown className="w-3 h-3" />{Math.abs(change)}
    </span>
  );
}
