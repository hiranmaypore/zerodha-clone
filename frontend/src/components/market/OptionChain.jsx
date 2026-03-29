import { useState, useMemo } from 'react';
import { X, CheckCircle } from 'lucide-react';

// Standard normal cumulative distribution function
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function normPDF(x) {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
}

// Black-Scholes Formula
function calcBS(optionType, S, K, T_days, volatility, riskFreeRate) {
  const T = T_days / 365;
  const sigma = volatility / 100;
  const r = riskFreeRate / 100;
  
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  let price;
  if (optionType === 'call') {
    price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  } else {
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
  }
  
  const delta = optionType === 'call' ? normCDF(d1) : normCDF(d1) - 1;
  const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const theta = optionType === 'call' 
    ? (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365 
    : (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
    
  return { price, delta, gamma, theta };
}

export default function OptionChain({ spotPrice = 22000, onAnalyze }) {
  const [expiry, setExpiry] = useState(7); // days
  const [iv, setIv] = useState(15); // volatility %
  const [selectedLegs, setSelectedLegs] = useState([]);
  
  // Generate strikes around spot
  const strikes = useMemo(() => {
    const atm = Math.round(spotPrice / 50) * 50;
    const arr = [];
    for (let i = -7; i <= 7; i++) {
      arr.push(atm + i * 50);
    }
    return arr;
  }, [spotPrice]);

  const toggleLeg = (symbol, strike, type, price) => {
    setSelectedLegs(prev => {
      const exists = prev.find(l => l.symbol === symbol);
      if (exists) return prev.filter(l => l.symbol !== symbol);
      const newLeg = { symbol, strike, type, price, qty: 50, side: 'BUY' };
      const updated = [...prev, newLeg];
      onAnalyze?.(updated);
      return updated;
    });
  };

  const updateSide = (symbol) => {
    setSelectedLegs(prev => {
      const updated = prev.map(l => l.symbol === symbol ? { ...l, side: l.side === 'BUY' ? 'SELL' : 'BUY' } : l);
      onAnalyze?.(updated);
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      
      {/* ── Selection Basket ── */}
      {selectedLegs.length > 0 && (
        <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-center justify-between flex-wrap gap-2">
           <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-accent">Active Strategy Basket:</span>
              <div className="flex gap-2">
                {selectedLegs.map(l => (
                  <div key={l.symbol} className="bg-card border border-edge rounded-lg px-2 py-1 flex items-center gap-2 shadow-sm">
                    <span className="text-[10px] font-bold text-primary">{l.symbol}</span>
                    <button 
                      onClick={() => updateSide(l.symbol)}
                      className={`text-[9px] font-bold px-1 rounded ${l.side === 'BUY' ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'}`}
                    >
                      {l.side}
                    </button>
                    <button onClick={() => toggleLeg(l.symbol)} className="text-muted hover:text-loss transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
           </div>
           <button 
            onClick={() => { setSelectedLegs([]); onAnalyze?.([]); }}
            className="text-[10px] text-muted hover:text-primary underline"
           >
             Clear Strategy
           </button>
        </div>
      )}

      <div className="bg-card border border-edge rounded-xl overflow-hidden flex flex-col shadow-xl">
        {/* ── Header ── */}
        <div className="px-5 py-3 border-b border-edge flex items-center justify-between bg-surface/30 flex-wrap gap-4">
          <div>
            <h2 className="font-semibold text-primary">NIFTY Option Chain</h2>
            <p className="text-xs text-muted mt-0.5">Spot: <span className="text-accent font-mono font-bold">₹{spotPrice.toFixed(2)}</span></p>
          </div>
          <div className="flex gap-6 items-center">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-muted tracking-wide uppercase">Expiry</span>
              <select 
                  className="bg-surface border border-edge rounded-md px-2 py-1 text-xs font-semibold text-primary outline-none focus:border-accent transition-colors" 
                  value={expiry} 
                  onChange={e=>setExpiry(Number(e.target.value))}>
                <option value={1}>1 Day</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-muted tracking-wide uppercase">
                  <span>IV</span>
                  <span className="text-primary font-bold">{iv}%</span>
              </div>
              <input 
                  type="range" min="5" max="50" value={iv} 
                  onChange={e=>setIv(Number(e.target.value))} 
                  className="w-24 accent-purple-500 cursor-pointer h-1" 
              />
            </div>
          </div>
        </div>
        
        {/* ── Table Header ── */}
        <div className="grid grid-cols-11 text-[10px] text-muted uppercase tracking-wider border-b border-edge bg-surface/50 font-semibold text-center sticky top-0 z-10">
          <div className="col-span-5 grid grid-cols-5">
              <div className="col-span-1 p-2 border-r border-edge">Delta</div>
              <div className="col-span-1 p-2 border-r border-edge">Theta</div>
              <div className="col-span-1 p-2 border-r border-edge">Gamma</div>
              <div className="col-span-2 p-2 border-r border-edge text-profit">CALL LTP</div>
          </div>
          <div className="col-span-1 p-2 bg-surface text-primary border-r border-l border-edge relative z-20">STRIKE</div>
          <div className="col-span-5 grid grid-cols-5">
              <div className="col-span-2 p-2 border-l border-edge text-loss">PUT LTP</div>
              <div className="col-span-1 p-2 border-l border-edge">Gamma</div>
              <div className="col-span-1 p-2 border-l border-edge">Theta</div>
              <div className="col-span-1 p-2 border-l border-edge">Delta</div>
          </div>
        </div>
        
        {/* ── Table Body ── */}
        <div className="divide-y divide-edge overflow-y-auto max-h-[50vh]">
          {strikes.map((strike) => {
            const isITM_Call = strike < spotPrice;
            const isITM_Put = strike > spotPrice;
            const call = calcBS('call', spotPrice, strike, expiry, iv, 6.5);
            const put = calcBS('put', spotPrice, strike, expiry, iv, 6.5);
            
            const callSym = `NIFTY_${strike}_CE`;
            const putSym = `NIFTY_${strike}_PE`;
            const isCallSelected = selectedLegs.some(l => l.symbol === callSym);
            const isPutSelected = selectedLegs.some(l => l.symbol === putSym);

            return (
              <div key={strike} className="grid grid-cols-11 text-xs text-center hover:bg-surface/60 transition-colors group">
                {/* CALLS */}
                <div className="col-span-5 grid grid-cols-5 bg-surface/10">
                    <div className="col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {call.delta.toFixed(2)}
                    </div>
                    <div className="col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {call.theta.toFixed(1)}
                    </div>
                    <div className="col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {call.gamma.toFixed(4)}
                    </div>
                    <button 
                      onClick={() => toggleLeg(callSym, strike, 'CALL', call.price)}
                      className={`col-span-2 p-2 border-r border-edge flex items-center justify-center font-mono font-bold transition-all relative
                        ${isCallSelected ? 'bg-profit text-white z-10 scale-[1.05] shadow-lg' : isITM_Call ? 'bg-profit/5 text-primary' : 'text-primary hover:bg-profit/10'}`}
                    >
                      ₹{call.price.toFixed(1)}
                      {isCallSelected && <CheckCircle className="w-2.5 h-2.5 absolute top-1 right-1" />}
                    </button>
                </div>
                
                {/* STRIKE */}
                <div className="col-span-1 p-2 bg-surface/50 font-bold text-primary font-mono relative flex items-center justify-center">
                  <span className="bg-surface/50 px-1 relative z-10">{strike}</span>
                </div>
                
                {/* PUTS */}
                <div className="col-span-5 grid grid-cols-5 bg-surface/10">
                    <button 
                      onClick={() => toggleLeg(putSym, strike, 'PUT', put.price)}
                      className={`col-span-2 p-2 border-l border-edge flex items-center justify-center font-mono font-bold transition-all relative
                        ${isPutSelected ? 'bg-loss text-white z-10 scale-[1.05] shadow-lg' : isITM_Put ? 'bg-loss/5 text-primary' : 'text-primary hover:bg-loss/10'}`}
                    >
                      ₹{put.price.toFixed(1)}
                      {isPutSelected && <CheckCircle className="w-2.5 h-2.5 absolute top-1 left-1" />}
                    </button>
                    <div className="col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {put.gamma.toFixed(4)}
                    </div>
                    <div className="col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {put.theta.toFixed(1)}
                    </div>
                    <div className="col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono text-muted text-[10px]">
                        {put.delta.toFixed(2)}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
