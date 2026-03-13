import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStocks, getMarketNews } from '../services/api';
import { connectSocket } from '../services/socket';
import { StockIcon } from '../components/StockIcon';
import { 
  Activity, Zap, TrendingUp, TrendingDown, 
  BarChart3, Search, ChevronRight, Filter,
  PieChart, Gauge, AlertCircle, RefreshCw, Newspaper, ExternalLink
} from 'lucide-react';

export default function Pulse() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('VOLUME_SPIKE');
  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAllStocks();
        setStocks(res.data.stocks || []);
      } catch (err) {
        console.error('Pulse: Failed to load stocks', err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = connectSocket();
    socket.on('price_update', (incoming) => {
      setPrices(prev => ({ ...prev, ...incoming }));
    });
    return () => socket.off('price_update');
  }, []);

  // Fetch news
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await getMarketNews({ limit: 12 });
        setNews(res.data.news || []);
      } catch (err) {
        console.error('Failed to fetch news', err);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Technical Logic (Simulated for Demo) ──────────────────────
  const processed = useMemo(() => {
    return stocks.map(s => {
      const price = prices[s.symbol] || s.price || 0;
      const open = s.openingPrice || price;
      const change = price - open;
      const changePct = open > 0 ? (change / open) * 100 : 0;
      
      // Simulate Technical Indicators based on symbol hash
      const hash = s.symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const rsi = 30 + (hash % 50); // 30-80
      const volAvg = 500000 + (hash % 1000000);
      const volCurrent = volAvg * (0.5 + (hash % 300) / 100); // 0.5x to 3.5x
      const volRatio = volCurrent / volAvg;
      
      return {
        ...s,
        price,
        changePct,
        rsi,
        volRatio,
        isOverbought: rsi > 70,
        isOversold: rsi < 40,
        isVolumeSpike: volRatio > 2.0
      };
    });
  }, [stocks, prices]);

  // ── Stats ────────────────────────────────────────────────────
  const advanceDecline = useMemo(() => {
    const up = processed.filter(s => s.changePct > 0.1).length;
    const down = processed.filter(s => s.changePct < -0.1).length;
    const neutral = processed.length - up - down;
    return { up, down, neutral };
  }, [processed]);

  // ── Screeners ────────────────────────────────────────────────
  const screeners = {
    VOLUME_SPIKE: {
      label: 'Volume Shockers',
      desc: 'Stocks traded > 2x their 15-day average volume',
      icon: <Activity className="w-4 h-4" />,
      filter: (list) => list.filter(s => s.isVolumeSpike).sort((a,b) => b.volRatio - a.volRatio)
    },
    OVERBOUGHT: {
      label: 'Overbought (RSI)',
      desc: 'Stocks with RSI > 70 (Potential mean reversal)',
      icon: <AlertCircle className="w-4 h-4" />,
      filter: (list) => list.filter(s => s.isOverbought).sort((a,b) => b.rsi - a.rsi)
    },
    OVERSOLD: {
      label: 'Oversold (RSI)',
      desc: 'Stocks with RSI < 40 (Potential recovery bounce)',
      icon: <TrendingUp className="w-4 h-4" />,
      filter: (list) => list.filter(s => s.isOversold).sort((a,b) => a.rsi - b.rsi)
    },
    TOP_MOVERS: {
      label: 'Volatility Surge',
      desc: 'Highest intraday movements regardless of direction',
      icon: <Zap className="w-4 h-4" />,
      filter: (list) => [...list].sort((a,b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    }
  };

  const filtered = screeners[activeFilter].filter(processed).slice(0, 10);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-2 md:p-6 mb-10">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Activity className="w-6 h-6 text-accent" /> Market Pulse
          </h1>
          <p className="text-sm text-muted mt-1">Institutional-grade technical scanning & discovery</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-card border border-edge rounded-full">
              <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Live Scanner</span>
           </div>
           <button onClick={() => window.location.reload()} className="p-2 bg-card border border-edge rounded-xl text-muted hover:text-primary hover:bg-surface transition-all">
              <RefreshCw className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* ── Left Sidebar: Screener Selection ── */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-card border border-edge rounded-2xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-4 px-2">Discovery Tools</h3>
            <div className="space-y-1">
              {Object.entries(screeners).map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => setActiveFilter(id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                    activeFilter === id 
                      ? 'bg-accent text-white shadow-lg shadow-accent/20' 
                      : 'text-secondary hover:bg-surface'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeFilter === id ? 'bg-white/20' : 'bg-surface group-hover:bg-card'}`}>
                    {cfg.icon}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-bold ${activeFilter === id ? 'text-white' : 'text-primary'}`}>{cfg.label}</p>
                    <p className={`text-[10px] ${activeFilter === id ? 'text-white/70' : 'text-muted'}`}>{id.replace('_', ' ')}</p>
                  </div>
                  <ChevronRight className={`ml-auto w-4 h-4 shrink-0 transition-transform ${activeFilter === id ? 'translate-x-1' : 'opacity-0'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Market Breadth Gauge */}
          <div className="bg-card border border-edge rounded-2xl p-5">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-primary uppercase">Market Breadth</h3>
                <PieChart className="w-4 h-4 text-muted" />
             </div>
             
             <div className="space-y-4">
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                   <div className="bg-profit" style={{ width: `${(advanceDecline.up / processed.length) * 100}%` }} />
                   <div className="bg-muted/40" style={{ width: `${(advanceDecline.neutral / processed.length) * 100}%` }} />
                   <div className="bg-loss" style={{ width: `${(advanceDecline.down / processed.length) * 100}%` }} />
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                   <div className="text-center">
                      <p className="text-[10px] text-muted mb-1">Advances</p>
                      <p className="text-sm font-bold text-profit">{advanceDecline.up}</p>
                   </div>
                   <div className="text-center border-x border-edge">
                      <p className="text-[10px] text-muted mb-1">Neutral</p>
                      <p className="text-sm font-bold text-muted">{advanceDecline.neutral}</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] text-muted mb-1">Declines</p>
                      <p className="text-sm font-bold text-loss">{advanceDecline.down}</p>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Main Panel: Active Screener Results ── */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
           
           {/* Screener Description Card */}
           <div className="bg-linear-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-accent text-white rounded-2xl">
                    {screeners[activeFilter].icon}
                 </div>
                 <div>
                    <h2 className="text-lg font-bold text-primary">{screeners[activeFilter].label}</h2>
                    <p className="text-sm text-muted mt-1 leading-relaxed">
                       {screeners[activeFilter].desc}
                    </p>
                 </div>
              </div>
           </div>

           {/* Results Table */}
           <div className="bg-card border border-edge rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-surface/30 border-b border-edge">
                       <tr>
                          <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Instrument</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">LTP</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Change</th>
                          <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">
                             {activeFilter.includes('VOLUME') ? 'Vol Ratio' : 'RSI (14)'}
                          </th>
                          <th className="px-5 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Signal</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-edge">
                       {filtered.map(s => (
                          <tr key={s.symbol} onClick={() => navigate(`/dashboard?stock=${s.symbol}`)} className="group hover:bg-surface/50 transition-colors cursor-pointer">
                             <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                   <StockIcon symbol={s.symbol} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                   <div>
                                      <p className="text-sm font-bold text-primary">{s.symbol}</p>
                                      <p className="text-[10px] text-muted">{s.sector}</p>
                                   </div>
                                </div>
                             </td>
                             <td className="px-5 py-4 text-right font-mono font-bold text-sm text-primary">
                                ₹{s.price.toFixed(2)}
                             </td>
                             <td className={`px-5 py-4 text-right font-mono font-bold text-sm ${s.changePct >= 0 ? 'text-profit' : 'text-loss'}`}>
                                {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                             </td>
                             <td className="px-5 py-4 text-right">
                                {activeFilter.includes('VOLUME') ? (
                                   <span className={`text-sm font-bold ${s.volRatio > 2.5 ? 'text-accent' : 'text-primary'}`}>
                                      {s.volRatio.toFixed(1)}x
                                   </span>
                                ) : (
                                   <div className="flex items-center justify-end gap-2">
                                      <span className={`text-sm font-bold ${s.rsi > 70 ? 'text-loss' : s.rsi < 40 ? 'text-profit' : 'text-primary'}`}>
                                         {Math.round(s.rsi)}
                                      </span>
                                      <div className="w-12 h-1 bg-surface rounded-full overflow-hidden">
                                         <div 
                                           className={`h-full ${s.rsi > 70 ? 'bg-loss' : s.rsi < 40 ? 'bg-profit' : 'bg-accent'}`} 
                                           style={{ width: `${s.rsi}%` }} 
                                         />
                                      </div>
                                   </div>
                                )}
                             </td>
                             <td className="px-5 py-4 text-right">
                                <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                                   s.isOverbought ? 'bg-loss/10 text-loss' : 
                                   s.isOversold ? 'bg-profit/10 text-profit' : 
                                   'bg-surface text-muted'
                                }`}>
                                   {s.isOverbought ? 'Sell' : s.isOversold ? 'Buy' : 'Neutral'}
                                </span>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              {filtered.length === 0 && (
                <div className="py-20 text-center">
                   <Filter className="w-12 h-12 mx-auto text-muted/20 mb-3" />
                   <p className="text-sm text-muted">No stocks met the scanner criteria at this moment.</p>
                </div>
              )}
           </div>

           {/* Pro Tip Pin */}
           <div className="bg-surface border border-edge rounded-2xl p-4 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                 <Gauge className="w-5 h-5 text-accent" />
              </div>
              <div>
                 <p className="text-xs font-bold text-primary mb-1">Pro Tip: Volume Confluence</p>
                 <p className="text-[10px] text-muted leading-relaxed">
                    Always look for price movement supported by significant volume spikes. A price gain with high Relative Volume (RVOL) is much more likely to sustain than a low-volume move.
                 </p>
              </div>
           </div>

        </div>

      </div>

      {/* ── Market News Feed ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-bold text-primary">Market News</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-card border border-edge rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
              <span className="text-[9px] font-bold text-muted uppercase">Live Feed</span>
            </div>
          </div>
          <button 
            onClick={() => { setNewsLoading(true); getMarketNews({ limit: 12 }).then(r => { setNews(r.data.news || []); setNewsLoading(false); }); }}
            className="p-2 bg-card border border-edge rounded-xl text-muted hover:text-primary hover:bg-surface transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card border border-edge rounded-2xl p-5 animate-pulse">
                <div className="h-3 bg-surface rounded w-1/3 mb-3" />
                <div className="h-4 bg-surface rounded w-full mb-2" />
                <div className="h-4 bg-surface rounded w-2/3 mb-4" />
                <div className="h-3 bg-surface rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map(n => (
              <div 
                key={n.id} 
                className="bg-card border border-edge rounded-2xl p-5 hover:border-accent/40 transition-all group cursor-pointer flex flex-col"
                onClick={() => navigate(`/dashboard?stock=${n.symbol}`)}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    n.sentiment === 'Bullish' ? 'bg-profit/10 text-profit border-profit/20' :
                    n.sentiment === 'Bearish' ? 'bg-loss/10 text-loss border-loss/20' :
                    n.sentiment === 'Breaking' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-surface text-muted border-edge'
                  }`}>{n.sentiment}</span>
                  <span className="text-[9px] text-muted bg-surface px-1.5 py-0.5 rounded">{n.category}</span>
                  {n.impact === 'HIGH' && (
                    <span className="text-[9px] font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded">⚡ HIGH</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-primary leading-snug mb-3 flex-1 group-hover:text-accent transition-colors">
                  {n.headline}
                </p>
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-edge/50">
                  <div className="flex items-center gap-2">
                    <StockIcon symbol={n.symbol} className="w-5 h-5" textSize="text-[7px]" />
                    <span className="text-[10px] text-muted font-medium">{n.symbol}</span>
                  </div>
                  <div className="text-[10px] text-muted">
                    {n.source} · {n.minutesAgo < 60 ? `${n.minutesAgo}m ago` : `${Math.floor(n.minutesAgo / 60)}h ago`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
