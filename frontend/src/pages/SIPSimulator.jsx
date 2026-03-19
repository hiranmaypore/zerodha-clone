import { useState, useMemo } from 'react';
import { 
  PiggyBank, TrendingUp, IndianRupee, ShieldCheck, PieChart as PieChartIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';

export default function SIPSimulator() {
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(15);
  const [returnRate, setReturnRate] = useState(12);
  const [stepUp, setStepUp] = useState(0);

  // Generate projections
  const { data, totalInvested, expectedWealth, totalWealth } = useMemo(() => {
    let currentWealth = 0;
    let currentInvested = 0;
    let currentMonthly = monthly;
    
    const plotData = [];
    
    // Monthly compounding loop
    for (let m = 1; m <= years * 12; m++) {
      currentInvested += currentMonthly;
      currentWealth = (currentWealth + currentMonthly) * (1 + (returnRate / 100) / 12);
      
      // Annual step up
      if (m % 12 === 0) {
        currentMonthly = currentMonthly * (1 + stepUp / 100);
        plotData.push({
          year: m / 12,
          Invested: Math.round(currentInvested),
          Returns: Math.round(currentWealth - currentInvested),
          Total: Math.round(currentWealth)
        });
      }
    }
    
    // If year 0 is needed
    plotData.unshift({ year: 0, Invested: 0, Returns: 0, Total: 0 });

    return {
      data: plotData,
      totalInvested: Math.round(currentInvested),
      expectedWealth: Math.round(currentWealth - currentInvested),
      totalWealth: Math.round(currentWealth)
    };
  }, [monthly, years, returnRate, stepUp]);

  const pieData = [
    { name: 'Invested', value: totalInvested, color: '#4f46e5' },
    { name: 'Est. Returns', value: expectedWealth, color: '#22c55e' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in p-4 lg:p-6 mb-20 text-primary">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-accent fill-accent/20" /> SIP Matrix Simulator
          </h1>
          <p className="text-sm text-muted mt-1.5 flex items-center gap-2">
            Visualize mutual fund growth curves with Step-Up mechanics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Panel */}
        <div className="lg:col-span-4 space-y-6 bg-card border border-edge rounded-3xl p-6 shadow-xl">
           
           <div className="space-y-6">
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-muted uppercase">Monthly Investment</label>
                    <span className="font-mono font-black text-lg text-primary">₹{monthly.toLocaleString('en-IN')}</span>
                 </div>
                 <input 
                   type="range" min="500" max="100000" step="500"
                   value={monthly} onChange={(e) => setMonthly(Number(e.target.value))}
                   className="w-full accent-accent"
                 />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-muted uppercase">Investment Period</label>
                    <span className="font-mono font-black text-lg text-primary">{years} Yr</span>
                 </div>
                 <input 
                   type="range" min="1" max="40" step="1"
                   value={years} onChange={(e) => setYears(Number(e.target.value))}
                   className="w-full accent-accent"
                 />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-muted uppercase">Expected Return</label>
                    <span className="font-mono font-black text-lg text-profit">{returnRate}%</span>
                 </div>
                 <input 
                   type="range" min="1" max="30" step="0.5"
                   value={returnRate} onChange={(e) => setReturnRate(Number(e.target.value))}
                   className="w-full h-1.5 bg-edge rounded-lg appearance-none cursor-pointer accent-profit"
                 />
              </div>

              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <label className="text-xs font-bold text-muted uppercase">Annual Step-Up (Auto-increase)</label>
                    <span className="font-mono font-black text-lg text-accent">{stepUp}%</span>
                 </div>
                 <input 
                   type="range" min="0" max="20" step="1"
                   value={stepUp} onChange={(e) => setStepUp(Number(e.target.value))}
                   className="w-full accent-accent"
                 />
              </div>
           </div>

           <div className="bg-surface/50 border border-edge rounded-2xl p-4 mt-8 flex gap-3 items-start">
             <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
             <p className="text-[11px] text-muted leading-relaxed">
               Returns do not reflect market volatility or taxation. This visualizer assumes standard monthly compounding. 
             </p>
           </div>
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-8 space-y-6">
           {/* Top Metric Cards */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-edge rounded-3xl p-6 relative overflow-hidden">
                 <div className="absolute -bottom-4 -right-4 bg-accent/5 rounded-full p-10">
                    <IndianRupee className="w-16 h-16 text-accent/20" />
                 </div>
                 <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Total Invested</p>
                 <p className="text-3xl font-black text-primary font-mono tracking-tighter">₹{totalInvested.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-surface border border-edge rounded-3xl p-6 relative overflow-hidden">
                 <div className="absolute -bottom-4 -right-4 bg-profit/5 rounded-full p-10">
                    <TrendingUp className="w-16 h-16 text-profit/20" />
                 </div>
                 <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-2">Est. Wealth Gain</p>
                 <p className="text-3xl font-black text-profit font-mono tracking-tighter">+₹{expectedWealth.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-card shadow-2xl shadow-accent/5 rounded-3xl p-6 relative overflow-hidden border-2 border-accent/20">
                 <p className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">Final Corpus</p>
                 <p className="text-3xl font-black text-primary font-mono tracking-tighter">₹{totalWealth.toLocaleString('en-IN')}</p>
              </div>
           </div>

           {/* Charts Grid */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Stacked Area Curve */}
              <div className="lg:col-span-8 bg-card border border-edge rounded-3xl p-6 h-[400px] flex flex-col">
                 <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                   <TrendingUp className="w-4 h-4 text-accent" /> Projection Curve
                 </h3>
                 <div className="flex-1 w-full min-h-0">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                         <defs>
                           <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                           </linearGradient>
                           <linearGradient id="colorReturn" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                         <XAxis 
                           dataKey="year" 
                           tick={{fontSize: 10, fill: '#888'}} 
                           tickFormatter={(val) => `Yr ${val}`}
                           axisLine={false} tickLine={false} 
                         />
                         <YAxis 
                           hide
                           domain={[0, 'auto']} 
                         />
                         <Tooltip 
                           contentStyle={{ backgroundColor: 'rgba(15,17,23,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                           itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}
                           labelStyle={{ color: '#888', fontSize: '11px', marginBottom: '4px' }}
                           formatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                           labelFormatter={(val) => `Year ${val}`}
                         />
                         <Area type="monotone" dataKey="Invested" stackId="1" stroke="#4f46e5" fill="url(#colorInvested)" strokeWidth={2} />
                         <Area type="monotone" dataKey="Returns" stackId="1" stroke="#22c55e" fill="url(#colorReturn)" strokeWidth={2} />
                      </AreaChart>
                   </ResponsiveContainer>
                 </div>
              </div>

              {/* Allocation Pie */}
              <div className="lg:col-span-4 bg-card border border-edge rounded-3xl p-6 h-[400px] flex flex-col items-center justify-center relative">
                 <h3 className="absolute top-6 left-6 text-sm font-bold text-primary flex items-center gap-2">
                   <PieChartIcon className="w-4 h-4 text-accent" /> Ratio
                 </h3>
                 <ResponsiveContainer width="100%" height={200} className="mt-8">
                    <PieChart>
                       <Pie
                         data={pieData}
                         cx="50%" cy="50%"
                         innerRadius={60}
                         outerRadius={80}
                         stroke="none"
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="w-full space-y-3 mt-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="flex items-center gap-2 text-muted"><div className="w-2 h-2 rounded-full bg-accent"></div> Invested</span>
                       <span className="font-mono font-bold">{Math.round((totalInvested/totalWealth)*100)}%</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="flex items-center gap-2 text-muted"><div className="w-2 h-2 rounded-full bg-profit"></div> Wealth Gain</span>
                       <span className="font-mono font-bold text-profit">{Math.round((expectedWealth/totalWealth)*100)}%</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
