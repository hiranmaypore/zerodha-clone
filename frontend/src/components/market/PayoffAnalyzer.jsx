import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { Target, AlertTriangle, TrendingUp, TrendingDown, Info } from 'lucide-react';

/**
 * PayoffAnalyzer
 * props:
 * - legs: Array of { type: 'CALL'|'PUT'|'STOCK', strike: number, price: number, qty: number, side: 'BUY'|'SELL' }
 * - spotPrice: current underlying price
 */
export default function PayoffAnalyzer({ legs = [], spotPrice = 22000 }) {
  
  const data = useMemo(() => {
    if (!legs.length) return [];
    
    // Determine range: 5% around strikes or spot
    const strikes = legs.filter(l => l.strike).map(l => l.strike);
    const minS = strikes.length ? Math.min(...strikes) : spotPrice;
    const maxS = strikes.length ? Math.max(...strikes) : spotPrice;
    
    const start = Math.floor(Math.min(minS, spotPrice) * 0.95 / 50) * 50;
    const end = Math.ceil(Math.max(maxS, spotPrice) * 1.05 / 50) * 50;
    
    const steps = [];
    for (let p = start; p <= end; p += 25) {
      let totalPnL = 0;
      legs.forEach(leg => {
        let legPnL = 0;
        if (leg.type === 'CALL') {
          const intrinsic = Math.max(0, p - leg.strike);
          legPnL = (intrinsic - leg.price) * Math.abs(leg.qty);
        } else if (leg.type === 'PUT') {
          const intrinsic = Math.max(0, leg.strike - p);
          legPnL = (intrinsic - leg.price) * Math.abs(leg.qty);
        } else if (leg.type === 'STOCK') {
          legPnL = (p - leg.price) * Math.abs(leg.qty);
        }
        
        if (leg.side === 'SELL') legPnL = -legPnL;
        totalPnL += legPnL;
      });
      steps.push({ price: p, pnl: Math.round(totalPnL) });
    }
    return steps;
  }, [legs, spotPrice]);

  const stats = useMemo(() => {
    if (!data.length) return null;
    const pnls = data.map(d => d.pnl);
    const maxProfit = Math.max(...pnls);
    const maxLoss = Math.min(...pnls);
    
    // Find breakeven: where P&L crosses zero
    let breakeven = [];
    for (let i = 0; i < data.length - 1; i++) {
      if ((data[i].pnl <= 0 && data[i+1].pnl > 0) || (data[i].pnl >= 0 && data[i+1].pnl < 0)) {
        breakeven.push(data[i].price);
      }
    }

    return {
      maxProfit: maxProfit > 50000 ? 'Unlimited' : `₹${maxProfit.toLocaleString()}`,
      maxLoss: maxLoss < -50000 ? 'Unlimited' : `₹${maxLoss.toLocaleString()}`,
      breakeven: breakeven.length ? breakeven.map(b => `₹${b}`).join(', ') : 'None',
      riskReward: maxLoss !== 0 ? Math.abs(maxProfit / maxLoss).toFixed(2) : 'N/A'
    };
  }, [data]);

  if (!legs.length) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted p-8 border border-dashed border-edge rounded-2xl bg-surface/30">
        <Target className="w-12 h-12 mb-4 opacity-10" />
        <p className="text-sm font-medium">No legs selected for analysis</p>
        <p className="text-[10px] opacity-60 mt-1 text-center max-w-[200px]">Add options or stocks from the chain to visualize your strategy payoff</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-edge rounded-2xl p-4 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary">Strategy Payoff</h3>
            <p className="text-[10px] text-muted">Expiratory P&L Analysis</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted uppercase tracking-wider">Spot Price</div>
          <div className="text-xs font-mono font-bold text-primary">₹{spotPrice.toFixed(1)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-surface/50 border border-edge rounded-xl p-2.5">
          <div className="text-[9px] text-muted mb-0.5 uppercase">Max Profit</div>
          <div className={`text-sm font-bold ${stats?.maxProfit === 'Unlimited' || parseInt(stats?.maxProfit.replace('₹','').replace(',','')) > 0 ? 'text-profit' : 'text-primary'}`}>
            {stats?.maxProfit}
          </div>
        </div>
        <div className="bg-surface/50 border border-edge rounded-xl p-2.5">
          <div className="text-[9px] text-muted mb-0.5 uppercase">Max Loss</div>
          <div className={`text-sm font-bold ${stats?.maxLoss === 'Unlimited' ? 'text-loss' : 'text-loss'}`}>
            {stats?.maxLoss}
          </div>
        </div>
        <div className="bg-surface/50 border border-edge rounded-xl p-2.5 col-span-2">
          <div className="text-[9px] text-muted mb-0.5 uppercase">Break-even(s)</div>
          <div className="text-sm font-bold text-accent font-mono">{stats?.breakeven}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[220px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="price" 
              fontSize={9} 
              tick={{ fill: 'var(--text-muted)' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${v}`}
            />
            <YAxis 
              fontSize={9} 
              tick={{ fill: 'var(--text-muted)' }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v === 0 ? '0' : `₹${v/1000}k`}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const val = payload[0].value;
                  return (
                    <div className="bg-card border border-edge p-2 rounded-lg shadow-xl text-[10px]">
                      <div className="text-muted mb-1">Price: <span className="text-primary font-bold">₹{payload[0].payload.price}</span></div>
                      <div className={val >= 0 ? 'text-profit font-bold' : 'text-loss font-bold'}>
                        P&L: {val >= 0 ? '+' : ''}₹{val.toLocaleString()}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
            <ReferenceLine x={spotPrice} stroke="var(--accent)" strokeDasharray="5 5" label={{ value: 'SPOT', position: 'top', fill: 'var(--accent)', fontSize: 10, fontWeight: 'bold' }} />
            <Area 
              type="monotone" 
              dataKey="pnl" 
              stroke={data[0]?.pnl >= 0 ? '#10b981' : '#ef4444'} 
              strokeWidth={2}
              fill="url(#pnlGrad)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 p-2 bg-surface rounded-xl border border-edge">
        <Info className="w-3.5 h-3.5 text-accent shrink-0" />
        <p className="text-[9px] text-muted italic leading-tight">
          Visualization is based on expiry prices. Real-time Greeks (Delta, Theta) not included in this view.
        </p>
      </div>
    </div>
  );
}
