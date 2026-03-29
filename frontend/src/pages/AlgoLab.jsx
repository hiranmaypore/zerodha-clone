import { useState, useEffect, useCallback } from 'react';
import { getSignals, buyOrder, runBacktest } from '../services/api';
import { 
  Zap, Activity, ShieldCheck, TrendingUp,
  LineChart, CheckCircle, Crosshair, ArrowRight, XCircle, Play, 
  RotateCcw, History, Target, Percent, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  CartesianGrid, XAxis, YAxis, Tooltip
} from 'recharts';
import { StockIcon } from '../components/StockIcon';

export default function AlgoLab() {
  const [tab, setTab] = useState('live'); // 'live' | 'backtest'
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [msg, setMsg] = useState(null);

  // Backtest states
  const [btLoading, setBtLoading] = useState(false);
  const [btResults, setBtResults] = useState(null);
  const [btConfig, setBtConfig] = useState({ symbol: 'RELIANCE', strategy: 'EMA_CROSS', timeframe: '30D' });

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

  const handleRunBacktest = async () => {
    setBtLoading(true);
    try {
      const { data } = await runBacktest(btConfig);
      setBtResults(data.results);
    } catch {
      setMsg({ type: 'error', text: 'Backtest failed to run' });
    } finally {
      setBtLoading(false);
    }
  };

  const handleCopyTrade = async (signal) => {
    setPlacingOrder(true);
    try {
      const payload = {
        stockSymbol: signal.symbol,
        quantity: 1, 
        orderType: 'MARKET',
        productType: 'MIS',
      };
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

  const generateEquityCurve = (strength) => {
    const base = 100000;
    let current = base;
    return Array.from({ length: 30 }, (_, i) => {
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
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-4 lg:p-6 mb-20 text-primary">
      {/* Page Header */}
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
        
        <div className="flex gap-1 bg-surface p-1 rounded-2xl border border-edge">
           <button 
             onClick={() => setTab('live')}
             className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'live' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-primary'}`}
           >
              Live Signals
           </button>
           <button 
             onClick={() => setTab('backtest')}
             className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${tab === 'backtest' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-muted hover:text-primary'}`}
           >
              Backtester
           </button>
        </div>
      </div>

      {tab === 'live' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Active Signals List (Left) */}
          <div className="xl:col-span-12 lg:xl:col-span-5 space-y-4">
            <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl relative overflow-hidden h-[calc(100vh-280px)] flex flex-col">
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
            </div>
          </div>

          {/* Deep Analytics (Right) */}
          <div className="xl:col-span-12 lg:xl:col-span-7 h-full">
            {selectedSignal ? (
              <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-edge/50 pb-6">
                   <div className="flex items-center gap-4">
                      <StockIcon symbol={selectedSignal.symbol} className="w-12 h-12" />
                      <div>
                        <h2 className="text-2xl font-black text-primary tracking-tight">{selectedSignal.symbol}</h2>
                        <p className="text-sm text-muted mt-1 font-medium">{selectedSignal.name || selectedSignal.strategy}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1">Generated At</div>
                      <div className="text-xs text-primary bg-surface px-3 py-1.5 rounded-lg border border-edge font-mono">
                        {new Date(selectedSignal.timestamp).toLocaleTimeString()}
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
                        <div className="space-y-2">
                           <div className="text-xs text-muted-foreground font-medium">Logic Interpretation</div>
                           <p className="text-[11px] leading-relaxed text-muted bg-surface/50 p-3 rounded-xl border border-edge">
                             {selectedSignal.trend === 'BULLISH' 
                               ? `The fast moving average has crossed above the slow moving average concurrently with an RSI of ${selectedSignal.indicators.rsi?.toFixed(1) || 'N/A'}, indicating strong bullish momentum.`
                               : `The fast moving average has crossed below the slow moving average, signaling bearish divergence.`}
                           </p>
                        </div>
                     </div>
                  </div>
                )}

                {/* Equity Curve Preview */}
                <div className="h-48 bg-dark/20 rounded-2xl p-4 border border-edge relative overflow-hidden">
                   <div className="absolute top-4 left-4 text-[10px] font-bold text-muted-foreground/60 z-10 flex items-center gap-1">
                     <TrendingUp className="w-3 h-3 text-profit" /> GENERIC PERFORMANCE PROJECTION
                   </div>
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={generateEquityCurve(selectedSignal.strength)}>
                         <defs>
                            <linearGradient id="eqColor" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                               <stop offset="95%" stopColor={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <Area type="monotone" dataKey="equity" stroke={selectedSignal.trend === 'BULLISH' ? '#22c55e' : '#ef4444'} strokeWidth={3} fill="url(#eqColor)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>

                {msg && (
                  <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold ${msg.type === 'success' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}>
                    {msg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {msg.text}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                   <button 
                     onClick={() => handleCopyTrade(selectedSignal)}
                     disabled={placingOrder}
                     className={`flex-1 py-4 font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                       selectedSignal.trend === 'BULLISH' 
                         ? 'bg-profit hover:bg-profit/90 text-dark shadow-profit/20' 
                         : 'bg-loss/50 cursor-not-allowed text-white'
                     }`}
                   >
                     {placingOrder ? '⏳ Executing...' : selectedSignal.trend === 'BULLISH' ? '1-Click Copy Trade (BUY)' : 'Short Entry Required'}
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Backtest Config */}
           <div className="lg:col-span-4 bg-card border border-edge rounded-3xl p-6 shadow-xl space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-accent" /> Playback System
              </h2>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase">Symbol</label>
                    <select 
                      value={btConfig.symbol}
                      onChange={(e) => setBtConfig({...btConfig, symbol: e.target.value})}
                      className="w-full bg-surface border border-edge rounded-xl p-3 text-sm focus:outline-none focus:border-accent text-primary"
                    >
                       <option value="RELIANCE">RELIANCE</option>
                       <option value="TCS">TCS</option>
                       <option value="INFY">INFY</option>
                       <option value="TATAMOTORS">TATA MOTORS</option>
                       <option value="HDFCBANK">HDFC BANK</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase">Strategy</label>
                    <select 
                      value={btConfig.strategy}
                      onChange={(e) => setBtConfig({...btConfig, strategy: e.target.value})}
                      className="w-full bg-surface border border-edge rounded-xl p-3 text-sm focus:outline-none focus:border-accent text-primary"
                    >
                       <option value="EMA_CROSS">EMA Crossover</option>
                       <option value="RSI_REVERSAL">RSI Reversal</option>
                       <option value="BOLLINGER_BREAKOUT">Bollinger Breakout</option>
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted uppercase">Timeframe</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['7D', '14D', '30D'].map(tf => (
                         <button 
                           key={tf}
                           onClick={() => setBtConfig({...btConfig, timeframe: tf})}
                           className={`py-2 rounded-lg text-xs font-bold border transition-all ${btConfig.timeframe === tf ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-surface border-edge text-muted'}`}
                         >
                           {tf}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button 
                   onClick={handleRunBacktest}
                   disabled={btLoading}
                   className="w-full py-4 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 mt-4 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   {btLoading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                   {btLoading ? 'Computing Logic...' : 'Run Simulation'}
                 </button>
              </div>
           </div>

           {/* Backtest Results */}
           <div className="lg:col-span-8 space-y-6">
              {btResults ? (
                <div className="bg-card border border-edge rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-black tracking-tight">{btResults.symbol} <span className="text-muted font-medium text-lg">Simulation</span></h3>
                        <p className="text-sm text-muted mt-1">Strategy: {btResults.strategy.replace('_', ' ')} · Timeframe: {btResults.timeframe}</p>
                      </div>
                      <div className="p-3 bg-profit/10 rounded-2xl">
                         <TrendingUp className="w-6 h-6 text-profit" />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-surface/50 border border-edge rounded-2xl p-4">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-1">
                            <Target className="w-3 h-3 text-accent" /> Est. Net P&L
                         </div>
                         <div className={`text-xl font-black font-mono ${btResults.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                            ₹{btResults.totalPnl.toLocaleString()}
                         </div>
                      </div>
                      <div className="bg-surface/50 border border-edge rounded-2xl p-4">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-1">
                            <Percent className="w-3 h-3 text-accent" /> ROI %
                         </div>
                         <div className={`text-xl font-black font-mono ${btResults.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                            {btResults.pnlPercent >= 0 ? '+' : ''}{btResults.pnlPercent}%
                         </div>
                      </div>
                      <div className="bg-surface/50 border border-edge rounded-2xl p-4">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-1">
                            <CheckCircle className="w-3 h-3 text-profit" /> Win Rate
                         </div>
                         <div className="text-xl font-black font-mono text-primary">
                            {btResults.winRate}%
                         </div>
                      </div>
                      <div className="bg-surface/50 border border-edge rounded-2xl p-4">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase mb-1">
                            <History className="w-3 h-3 text-accent" /> No. Trades
                         </div>
                         <div className="text-xl font-black font-mono text-primary">
                            {btResults.tradesCount}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3 mb-8">
                      <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase text-primary">
                         <span>Profitability Analysis</span>
                         <span className="text-accent underline decoration-dotted">Cumulative Equity Curve</span>
                      </div>
                      <div className="h-64 w-full bg-dark/20 rounded-3xl border border-edge p-6 overflow-hidden">
                         <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={btResults.equityCurve}>
                               <defs>
                                  <linearGradient id="eqBtColor" x1="0" y1="0" x2="0" y2="1">
                                     <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                                     <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                               <XAxis dataKey="day" hide />
                               <YAxis hide domain={['auto', 'auto']} />
                               <Tooltip 
                                 contentStyle={{ backgroundColor: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                 itemStyle={{ color: '#fff', fontSize: '12px' }}
                                 labelStyle={{ display: 'none' }}
                               />
                               <Area type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={3} fill="url(#eqBtColor)" />
                            </AreaChart>
                         </ResponsiveContainer>
                      </div>
                   </div>

                   <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 flex gap-4">
                      <div className="p-2 bg-accent/20 rounded-xl shrink-0">
                         <Info className="w-4 h-4 text-accent" />
                      </div>
                      <p className="text-[11px] text-primary/70 leading-relaxed italic">
                        Simulation results based on historical pricing data and strategy execution logs. Past performance is not indicative of future results. Risk disclosure: High.
                      </p>
                   </div>
                </div>
              ) : (
                <div className="bg-card border border-edge rounded-3xl p-20 flex flex-col items-center justify-center text-center opacity-40">
                   <div className="w-16 h-16 bg-surface rounded-3xl border border-edge flex items-center justify-center mb-6">
                      <History className="w-8 h-8 text-muted" />
                   </div>
                   <h3 className="text-xl font-bold text-primary">Simulation Ready</h3>
                   <p className="text-xs text-muted mt-2 max-w-xs mx-auto">
                      Select your parameters on the left and click "Run Simulation" to generate backtest reports.
                   </p>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
}
