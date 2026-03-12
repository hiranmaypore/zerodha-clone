import { useState } from 'react';
import { 
  Zap, Plus, Trash2, Play, Activity, 
  Settings2, Target, ShieldCheck, TrendingUp,
  LineChart, MousePointer2, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

const INDICATORS = [
  { id: 'RSI', name: 'RSI', params: ['Period'], defaultParams: [14], range: [0, 100] },
  { id: 'EMA', name: 'EMA', params: ['Period'], defaultParams: [20] },
  { id: 'SMA', name: 'SMA', params: ['Period'], defaultParams: [50] },
  { id: 'PRICE', name: 'Close Price', params: [], defaultParams: [] },
  { id: 'VOLUME', name: 'Volume', params: [], defaultParams: [] }
];

const OPERATORS = [
  { id: 'GT', label: '>', desc: 'Greater than' },
  { id: 'LT', label: '<', desc: 'Less than' },
  { id: 'CROSS_ABOVE', label: 'Crosses Above', desc: 'Price or Line breaks upward' },
  { id: 'CROSS_BELOW', label: 'Crosses Below', desc: 'Price or Line breaks downward' }
];

export default function AlgoLab() {
  const [conditions, setConditions] = useState([
    { id: 1, left: 'RSI', leftParam: 14, op: 'LT', right: 'VALUE', rightValue: 30 }
  ]);
  const [backtestRunning, setBacktestRunning] = useState(false);
  const [results, setResults] = useState(null);

  const addCondition = () => {
    setConditions([...conditions, { 
      id: Date.now(), left: 'EMA', leftParam: 20, op: 'GT', right: 'SMA', rightParam: 50 
    }]);
  };

  const removeCondition = (id) => {
    if (conditions.length > 1) setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id, key, val) => {
    setConditions(conditions.map(c => c.id === id ? { ...c, [key]: val } : c));
  };

  const runBacktest = () => {
    setBacktestRunning(true);
    setResults(null);
    
    // Simulate backtest calculation
    setTimeout(() => {
      const mockData = Array.from({ length: 30 }, (_, i) => ({
        time: i,
        equity: 100000 + Math.random() * 20000 * (i / 15) - 5000
      }));
      setResults({
        equityCurve: mockData,
        winRate: (65 + Math.random() * 10).toFixed(1),
        trades: Math.floor(40 + Math.random() * 20),
        pnl: '+₹14,240',
        pnlPct: '+14.24%',
        maxDD: '-4.2%'
      });
      setBacktestRunning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in p-4 lg:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Zap className="w-8 h-8 text-accent fill-accent/20" /> Algo Lab
          </h1>
          <p className="text-sm text-muted mt-1.5 flex items-center gap-2">
            Professional Strategy Builder & Backtesting Engine <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px] font-bold">BETA</span>
          </p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={runBacktest}
             disabled={backtestRunning}
             className="flex items-center gap-2 px-6 py-3 bg-profit text-dark font-bold rounded-xl hover:bg-profit/90 transition-all disabled:opacity-50 shadow-lg shadow-profit/20"
           >
             {backtestRunning ? (
               <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />
             ) : <Play className="w-4 h-4 fill-current" />}
             {backtestRunning ? 'Backtesting...' : 'Run Analysis'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── Builder Section ── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl relative overflow-hidden">
             {/* Header */}
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                   <div className="p-2 bg-accent/10 rounded-xl">
                      <Settings2 className="w-5 h-5 text-accent" />
                   </div>
                   <h2 className="text-lg font-bold text-primary">Entry Logic</h2>
                </div>
                <button 
                  onClick={addCondition}
                  className="p-2 bg-surface hover:bg-surface/80 text-accent rounded-xl border border-edge transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" /> Add Rule
                </button>
             </div>

             {/* Conditions List */}
             <div className="space-y-4 relative z-10">
                {conditions.map((cond, idx) => (
                  <div key={cond.id} className="group relative flex flex-col md:flex-row items-center gap-3 bg-surface/40 p-4 rounded-2xl border border-edge/60 hover:border-accent/40 transition-all">
                    {idx > 0 && (
                      <div className="absolute -top-3 left-8 bg-card border border-edge px-3 py-0.5 rounded-full text-[10px] font-black text-muted uppercase tracking-tighter">
                        AND
                      </div>
                    )}

                    {/* Left Side */}
                    <div className="flex gap-2 flex-1 w-full">
                       <select 
                         value={cond.left}
                         onChange={(e) => updateCondition(cond.id, 'left', e.target.value)}
                         className="flex-1 bg-card border border-edge rounded-xl px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                       >
                         {INDICATORS.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                       </select>
                       {INDICATORS.find(i => i.id === cond.left)?.params.length > 0 && (
                         <input 
                           type="number"
                           value={cond.leftParam}
                           onChange={(e) => updateCondition(cond.id, 'leftParam', e.target.value)}
                           className="w-16 bg-card border border-edge rounded-xl px-2 py-2 text-xs text-center text-accent font-bold outline-none"
                         />
                       )}
                    </div>

                    {/* Operator */}
                    <select 
                       value={cond.op}
                       onChange={(e) => updateCondition(cond.id, 'op', e.target.value)}
                       className="w-full md:w-32 bg-accent text-white border-none rounded-xl px-3 py-2 text-xs font-bold text-center appearance-none cursor-pointer hover:bg-accent/80 transition-colors"
                    >
                      {OPERATORS.map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                    </select>

                    {/* Right Side */}
                    <div className="flex gap-2 flex-1 w-full">
                       <select 
                         value={cond.right === 'VALUE' ? 'VALUE' : cond.right}
                         onChange={(e) => updateCondition(cond.id, 'right', e.target.value)}
                         className="flex-1 bg-card border border-edge rounded-xl px-3 py-2 text-sm text-primary outline-none focus:border-accent"
                       >
                         <option value="VALUE">Fixed Value</option>
                         {INDICATORS.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
                       </select>
                       {cond.right === 'VALUE' ? (
                         <input 
                           type="number"
                           value={cond.rightValue}
                           onChange={(e) => updateCondition(cond.id, 'rightValue', e.target.value)}
                           className="w-20 bg-card border border-edge rounded-xl px-2 py-2 text-xs text-center text-accent font-bold outline-none"
                         />
                       ) : (
                         INDICATORS.find(i => i.id === cond.right)?.params.length > 0 && (
                           <input 
                             type="number"
                             value={cond.rightParam}
                             onChange={(e) => updateCondition(cond.id, 'rightParam', e.target.value)}
                             className="w-16 bg-card border border-edge rounded-xl px-2 py-2 text-xs text-center text-accent font-bold outline-none"
                           />
                         )
                       )}
                    </div>

                    <button 
                      onClick={() => removeCondition(cond.id)}
                      className="p-2 text-muted hover:text-loss transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
             </div>

             <div className="mt-8 flex items-center justify-between p-4 bg-muted/5 rounded-2xl border border-dashed border-edge">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-profit/10 rounded-full">
                      <Target className="w-4 h-4 text-profit" />
                   </div>
                   <p className="text-xs text-muted-foreground">Action: <span className="text-profit font-bold">OPEN BUY POSITION</span></p>
                </div>
                <div className="text-[10px] text-muted-foreground">Last updated: Just now</div>
             </div>

             {/* Background Decoration */}
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl space-y-4">
             <div className="flex items-center gap-2.5">
                <div className="p-2 bg-loss/10 rounded-xl">
                   <ShieldCheck className="w-5 h-5 text-loss" />
                </div>
                <h2 className="text-lg font-bold text-primary">Exit & Risk Control</h2>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                   <label className="text-xs font-bold text-muted uppercase">Target Profit</label>
                   <div className="relative">
                      <input type="number" defaultValue="5" className="w-full bg-surface border border-edge rounded-2xl px-4 py-3 text-sm text-profit font-bold outline-none" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">%</span>
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-xs font-bold text-muted uppercase">Stop Loss</label>
                   <div className="relative">
                      <input type="number" defaultValue="2" className="w-full bg-surface border border-edge rounded-2xl px-4 py-3 text-sm text-loss font-bold outline-none" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted font-bold">%</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* ── Results Sidebar ── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-card border border-edge rounded-3xl p-6 shadow-xl h-full flex flex-col min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                   <Activity className="w-5 h-5 text-accent" /> Performance Analysis
                </h2>
                {results && (
                  <span className="px-2 py-1 bg-profit/10 text-profit text-[10px] font-bold rounded-full">OPTIMIZED</span>
                )}
             </div>

             {results ? (
                <div className="flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                   {/* Summary Stats */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                         <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Win Rate</p>
                         <p className="text-2xl font-black text-profit font-mono">{results.winRate}%</p>
                      </div>
                      <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                         <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Net P&L</p>
                         <p className="text-2xl font-black text-profit font-mono">{results.pnl}</p>
                      </div>
                      <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                         <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Total Trades</p>
                         <p className="text-2xl font-black text-primary font-mono">{results.trades}</p>
                      </div>
                      <div className="bg-surface/50 p-4 rounded-2xl border border-edge">
                         <p className="text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Max Drawdown</p>
                         <p className="text-2xl font-black text-loss font-mono">{results.maxDD}</p>
                      </div>
                   </div>

                   {/* Mini Equity Curve */}
                   <div className="flex-1 min-h-[200px] bg-dark/20 rounded-2xl p-4 border border-edge relative">
                      <div className="absolute top-4 left-4 text-[10px] font-bold text-muted-foreground/60 z-10 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-profit" /> EQUITY GROWTH CURVE
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={results.equityCurve}>
                            <defs>
                               <linearGradient id="eqColor" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                            <Tooltip 
                               contentStyle={{ backgroundColor: '#131722', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                               labelStyle={{ display: 'none' }}
                            />
                            <Area 
                               type="monotone" 
                               dataKey="equity" 
                               stroke="#22c55e" 
                               strokeWidth={3}
                               fillOpacity={1} 
                               fill="url(#eqColor)" 
                            />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>

                   <button className="w-full py-4 bg-accent hover:bg-accent/80 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
                      <Zap className="w-4 h-4 fill-current" /> Deploy to AlgoBot
                   </button>
                </div>
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-8 opacity-40">
                   <LineChart className="w-16 h-16 text-muted mb-2" />
                   <h3 className="font-bold text-primary">No Data Yet</h3>
                   <p className="text-xs text-muted leading-relaxed">
                     Configure your strategy logic on the left and click <b>"Run Analysis"</b> to generate performance metrics.
                   </p>
                   <div className="flex gap-4 pt-4">
                      <div className="flex items-center gap-1 text-[10px] font-bold"><MousePointer2 className="w-3 h-3" /> Select Indicators</div>
                      <div className="flex items-center gap-1 text-[10px] font-bold"><Zap className="w-3 h-3" /> Set Rules</div>
                   </div>
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-edge rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
         <div className="p-4 bg-accent/10 rounded-2xl">
            <Info className="w-6 h-6 text-accent" />
         </div>
         <div className="flex-1">
            <h4 className="font-bold text-primary text-sm">How it works</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
               The Algo Lab simulates your logic against the last 24-48 hours of historical data across all NIFTY-20 stocks. 
               <b>"Crosses Above"</b> rules are high-probability trend-following indicators, while <b>"LT/GT"</b> (fixed values) are typically used for mean-reversal strategies like RSI oversold conditions.
            </p>
         </div>
      </div>
    </div>
  );
}
