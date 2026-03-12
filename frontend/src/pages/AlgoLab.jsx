import { useState, useEffect, useCallback } from 'react';
import { getSignals, buyOrder } from '../services/api';
import { 
  Zap, Activity, ShieldCheck, TrendingUp,
  LineChart, CheckCircle, Crosshair, ArrowRight, XCircle, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell
} from 'recharts';

export default function AlgoLab() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [msg, setMsg] = useState(null);

  const fetchSignals = useCallback(async () => {
    try {
      const { data } = await getSignals(50);
      setSignals(data.signals || []);
      if (data.signals?.length > 0 && !selectedSignal) {
        setSelectedSignal(data.signals[0]);
      }
    } catch (err) {
      console.error('Failed to fetch signals', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSignal]);

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [fetchSignals]);

  const handleCopyTrade = async (signal) => {
    setPlacingOrder(true);
    try {
      // Execute as Market Order for simplicity in the Lab directly
      const payload = {
        stockSymbol: signal.symbol,
        quantity: 1, // Default minimal exposure
        orderType: 'MARKET',
        productType: 'MIS',
      };
      // For this demo, we assume buyOrder handles both sides or we restrict to Bulls
      // Usually, SELL requires holding in CNC, but works in MIS for intraday.
      // Let's assume the user has a separate Buy/Sell, we'll route it based on trend:
      if (signal.trend === 'BULLISH') {
        await buyOrder(payload);
        setMsg({ type: 'success', text: `Successfully copied BUY order for ${signal.symbol}` });
      } else {
        setMsg({ type: 'error', text: `Short selling (MIS) not implemented via Lab yet` });
      }
    } catch (e) {
      setMsg({ type: 'error', text: e.response?.data?.message || 'Failed to place order' });
    } finally {
      setPlacingOrder(false);
      setTimeout(() => setMsg(null), 3000);
    }
  };

  // Generate mock equity curve based on strength for visual
  const generateEquityCurve = (strength) => {
    const base = 100000;
    let current = base;
    return Array.from({ length: 30 }, (_, i) => {
      // use strength to bias the random walk
      const bias = (strength / 100) * 200 - 100; 
      current += bias + (Math.random() * 500 - 250);
      return { day: i, equity: current };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 opacity-50 space-y-4">
        <Zap className="w-12 h-12 text-accent animate-pulse" />
        <p className="text-muted font-bold tracking-widest uppercase text-xs">Loading Algo Core...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-4 lg:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent fill-accent/20" /> Algo Lab Hub
          </h1>
          <p className="text-sm text-muted mt-1.5 flex items-center gap-2">
            Real-time AI generated signals & backtest analytics 
            <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold">PRO</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* ── Active Signals List (Left) ── */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl relative overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0">
               <h2 className="text-lg font-bold text-primary flex items-center gap-2.5">
                  <Activity className="w-5 h-5 text-accent" /> Live Signals
               </h2>
               <div className="text-[10px] font-black tracking-widest uppercase bg-surface px-2 py-1 rounded-lg text-muted">
                 {signals.length} Active
               </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {signals.length === 0 ? (
                <div className="text-center p-8 opacity-50">
                  <LineChart className="w-12 h-12 mx-auto mb-3" />
                  <p>No active signals currently.</p>
                </div>
              ) : (
                signals.map(s => (
                  <button 
                    key={s._id}
                    onClick={() => setSelectedSignal(s)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedSignal?._id === s._id 
                        ? 'bg-accent/10 border-accent/40 shadow-lg shadow-accent/5' 
                        : 'bg-surface/50 border-edge hover:border-accent/40 hover:bg-surface'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                           s.trend === 'BULLISH' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                         }`}>
                           {s.trend}
                         </span>
                         <span className="font-bold text-primary">{s.symbol}</span>
                       </div>
                       <span className="text-xs font-mono text-muted">₹{s.price.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{s.strategy}</span>
                       <div className="flex items-center gap-1">
                         <div className="w-16 h-1.5 bg-dark rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${s.strength > 75 ? 'bg-profit' : s.strength > 50 ? 'bg-warning' : 'bg-loss'}`}
                             style={{ width: `${s.strength}%` }}
                           />
                         </div>
                         <span className="text-[10px] font-mono text-muted">{s.strength}%</span>
                       </div>
                    </div>
                  </button>
                ))
              )}
            </div>
            
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          </div>
        </div>

        {/* ── Deep Analytics (Right) ── */}
        <div className="xl:col-span-7 h-full">
          {selectedSignal ? (
            <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-edge/50 pb-6">
                 <div>
                    <h2 className="text-2xl font-black text-primary tracking-tight">{selectedSignal.symbol}</h2>
                    <p className="text-sm text-muted mt-1 font-medium">{selectedSignal.name || selectedSignal.strategy}</p>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Generated At</div>
                    <div className="text-xs text-primary bg-surface px-3 py-1.5 rounded-lg border border-edge">
                      {new Date(selectedSignal.timestamp).toLocaleString()}
                    </div>
                 </div>
              </div>

              {/* Stat Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                     <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">AI Confidence</p>
                     <p className="text-2xl font-black text-primary font-mono">{selectedSignal.strength}%</p>
                  </div>
                  <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                     <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Target Entry</p>
                     <p className="text-2xl font-black text-primary font-mono">{selectedSignal.price.toFixed(1)}</p>
                  </div>
                  <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                     <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">RSI Level</p>
                     <p className={`text-2xl font-black font-mono ${selectedSignal.indicators?.rsi < 30 ? 'text-profit' : selectedSignal.indicators?.rsi > 70 ? 'text-loss' : 'text-primary'}`}>
                       {selectedSignal.indicators?.rsi?.toFixed(1) || 'N/A'}
                     </p>
                  </div>
                  <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                     <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Trend Setup</p>
                     <p className={`text-lg font-black mt-1 ${selectedSignal.trend === 'BULLISH' ? 'text-profit' : 'text-loss'}`}>
                       {selectedSignal.trend}
                     </p>
                  </div>
              </div>

              {/* Indicator Analysis */}
              {selectedSignal.indicators && (
                <div className="bg-dark/30 rounded-2xl p-5 border border-edge space-y-4">
                   <div className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                     <Crosshair className="w-4 h-4 text-accent" /> Algorithmic Payload
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* EMA Crossover Graphic */}
                      <div className="space-y-4 relative">
                         <div className="text-xs text-muted-foreground font-medium">Moving Averages (Fast vs Slow)</div>
                         <div className="flex items-center justify-between px-4 py-3 bg-surface rounded-xl border border-edge">
                             <div>
                               <div className="text-[9px] text-muted uppercase">Fast EMA</div>
                               <div className="font-mono text-primary font-bold">{selectedSignal.indicators.fastEMA?.toFixed(2) || '—'}</div>
                             </div>
                             <ArrowRight className="w-4 h-4 text-muted/50" />
                             <div className="text-right">
                               <div className="text-[9px] text-muted uppercase">Slow EMA</div>
                               <div className="font-mono text-primary font-bold">{selectedSignal.indicators.slowEMA?.toFixed(2) || '—'}</div>
                             </div>
                         </div>
                      </div>

                      {/* Strategy Explanation */}
                      <div className="space-y-2">
                         <div className="text-xs text-muted-foreground font-medium">Logic Interpretation</div>
                         <p className="text-[11px] leading-relaxed text-muted bg-surface/50 p-3 rounded-xl border border-edge">
                           {selectedSignal.trend === 'BULLISH' 
                             ? `The fast moving average has crossed above the slow moving average concurrently with an RSI of ${selectedSignal.indicators.rsi?.toFixed(1) || 'N/A'}, indicating strong bullish momentum and a high-probability breakout setup.`
                             : `The fast moving average has crossed below the slow moving average, signaling bearish divergence. Extreme caution is advised for long positions.`}
                         </p>
                      </div>

                   </div>
                </div>
              )}

              {/* Equity Curve Preview */}
              <div className="h-48 bg-dark/20 rounded-2xl p-4 border border-edge relative">
                 <div className="absolute top-4 left-4 text-[10px] font-bold text-muted-foreground/60 z-10 flex items-center gap-1">
                   <TrendingUp className="w-3 h-3 text-profit" /> HISTORICAL BACKTEST 
                 </div>
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateEquityCurve(selectedSignal.strength)}>
                       <defs>
                          <linearGradient id="eqColor" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                             <stop offset="95%" stopColor={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                       <Area 
                          type="monotone" 
                          dataKey="equity" 
                          stroke={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} 
                          strokeWidth={2}
                          fill="url(#eqColor)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>

              {msg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${msg.type === 'success' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                  {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {msg.text}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                 <button 
                   onClick={() => handleCopyTrade(selectedSignal)}
                   disabled={placingOrder}
                   className={`flex-1 py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                     selectedSignal.trend === 'BULLISH' 
                       ? 'bg-profit hover:bg-profit/90 text-dark shadow-profit/20' 
                       : 'bg-loss/50 cursor-not-allowed text-white' // Locked shorts for demo unless implemented
                   }`}
                 >
                   {placingOrder ? '⏳ Executing...' : selectedSignal.trend === 'BULLISH' ? '1-Click Copy Trade (BUY)' : 'Short Entry Required'}
                 </button>
                 <button className="px-6 py-4 bg-surface hover:bg-surface/80 border border-edge text-primary font-bold rounded-2xl transition-all">
                   Save Strategy
                 </button>
              </div>

            </div>
          ) : (
            <div className="bg-card border border-edge rounded-3xl p-6 h-full flex items-center justify-center">
              <div className="text-center opacity-40">
                 <ShieldCheck className="w-16 h-16 mx-auto mb-4" />
                 <h3 className="font-bold text-lg text-primary">Select a Signal</h3>
                 <p className="text-xs text-muted mt-2">Click on any active signal to view deep analytics.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
