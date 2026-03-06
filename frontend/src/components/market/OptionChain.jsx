import { useState, useMemo } from 'react';

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

export default function OptionChain({ spotPrice = 22000 }) {
  const [expiry, setExpiry] = useState(7); // days
  const [iv, setIv] = useState(15); // volatility %
  
  // Generate strikes around spot
  const strikes = useMemo(() => {
    // Round spot to nearest 50 for realistic NIFTY strikes
    const atm = Math.round(spotPrice / 50) * 50;
    const arr = [];
    for (let i = -10; i <= 10; i++) {
        // Nifty usually has 50 point strikes
      arr.push(atm + i * 50);
    }
    return arr;
  }, [spotPrice]);

  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden flex flex-col animate-fade-in">
      {/* ── Header ── */}
      <div className="px-5 py-3 border-b border-edge flex items-center justify-between bg-surface/30 flex-wrap gap-4">
        <div>
          <h2 className="font-semibold text-primary">NIFTY Option Chain</h2>
          <p className="text-xs text-muted mt-0.5">Spot: <span className="text-accent font-mono font-bold">₹{spotPrice.toFixed(2)}</span></p>
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] text-muted tracking-wide uppercase">Days to Expiry</span>
            <select 
                className="bg-surface border border-edge rounded-md px-2 py-1.5 text-xs font-semibold text-primary outline-none focus:border-accent transition-colors" 
                value={expiry} 
                onChange={e=>setExpiry(Number(e.target.value))}>
               <option value={1}>1 Day (0DTE)</option>
               <option value={7}>7 Days (Weekly)</option>
               <option value={30}>30 Days (Monthly)</option>
               <option value={90}>90 Days (Quarterly)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[10px] text-muted tracking-wide uppercase">
                <span>Implied Vol (IV)</span>
                <span className="text-primary font-bold">{iv}%</span>
            </div>
            <input 
                type="range" 
                min="5" 
                max="50" 
                value={iv} 
                onChange={e=>setIv(Number(e.target.value))} 
                className="w-32 accent-purple-500 cursor-pointer" 
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
      <div className="divide-y divide-edge overflow-y-auto max-h-[60vh]">
        {strikes.map((strike, idx) => {
          const isITM_Call = strike < spotPrice;
          const isITM_Put = strike > spotPrice;
          
          const call = calcBS('call', spotPrice, strike, expiry, iv, 6.5);
          const put = calcBS('put', spotPrice, strike, expiry, iv, 6.5);
          
          return (
            <div key={strike} className="grid grid-cols-11 text-xs text-center hover:bg-surface/60 transition-colors group">
              {/* CALLS */}
              <div className="col-span-5 grid grid-cols-5 bg-surface/10">
                  <div className={`col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono ${isITM_Call ? 'bg-profit/5 text-secondary' : 'text-muted'}`}>
                      {call.delta.toFixed(3)}
                  </div>
                  <div className={`col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono ${isITM_Call ? 'bg-profit/5 text-secondary' : 'text-muted'}`}>
                      {call.theta.toFixed(2)}
                  </div>
                  <div className={`col-span-1 p-2 border-r border-edge flex items-center justify-center font-mono ${isITM_Call ? 'bg-profit/5 text-secondary' : 'text-muted'}`}>
                      {call.gamma.toFixed(4)}
                  </div>
                  <div className={`col-span-2 p-2 border-r border-edge flex items-center justify-center font-mono font-bold text-primary ${isITM_Call ? 'bg-profit/10' : ''} group-hover:text-profit transition-colors`}>
                    ₹{call.price.toFixed(2)}
                  </div>
              </div>
              
              {/* STRIKE */}
              <div className="col-span-1 p-2 bg-surface/50 font-bold text-primary font-mono relative flex items-center justify-center shadow-[inset_0_0_10px_rgba(0,0,0,0.2)]">
                {idx === 10 && <div className="absolute left-0 right-0 top-1/2 -mt-[0.5px] border-t border-dashed border-accent/60 pointer-events-none" />}
                <span className="bg-surface/50 px-1 relative z-10">{strike}</span>
              </div>
              
              {/* PUTS */}
              <div className="col-span-5 grid grid-cols-5 bg-surface/10">
                  <div className={`col-span-2 p-2 border-l border-edge flex items-center justify-center font-mono font-bold text-primary ${isITM_Put ? 'bg-loss/10' : ''} group-hover:text-loss transition-colors`}>
                    ₹{put.price.toFixed(2)}
                  </div>
                  <div className={`col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono ${isITM_Put ? 'bg-loss/5 text-secondary' : 'text-muted'}`}>
                      {put.gamma.toFixed(4)}
                  </div>
                  <div className={`col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono ${isITM_Put ? 'bg-loss/5 text-secondary' : 'text-muted'}`}>
                      {put.theta.toFixed(2)}
                  </div>
                  <div className={`col-span-1 p-2 border-l border-edge flex items-center justify-center font-mono ${isITM_Put ? 'bg-loss/5 text-secondary' : 'text-muted'}`}>
                      {put.delta.toFixed(3)}
                  </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
