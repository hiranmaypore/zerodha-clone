import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';

export default function SectorHeatmap({ stocks }) {
  const sectors = useMemo(() => {
    const map = {};
    stocks.forEach(s => {
      if (!map[s.sector]) {
        map[s.sector] = { totalChange: 0, count: 0, stocks: [] };
      }
      map[s.sector].totalChange += s.changePct;
      map[s.sector].count += 1;
      map[s.sector].stocks.push(s);
    });

    return Object.entries(map).map(([name, data]) => ({
      name,
      avgChange: data.totalChange / data.count,
      count: data.count,
      topStock: [...data.stocks].sort((a, b) => b.changePct - a.changePct)[0]
    })).sort((a, b) => b.avgChange - a.avgChange);
  }, [stocks]);

  return (
    <div className="bg-card border border-edge rounded-2xl overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-edge flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-bold text-primary">Market Heatmap & Sector Analysis</h2>
        </div>
        <div className="flex gap-4 items-center">
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-profit" />
                <span className="text-[10px] text-muted">Bullish</span>
            </div>
            <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-loss" />
                <span className="text-[10px] text-muted">Bearish</span>
            </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sectors.map(sector => {
          const isPos = sector.avgChange >= 0;
          const intensity = Math.min(Math.abs(sector.avgChange) * 40, 90); // Scale opacity based on performance

          return (
            <div 
              key={sector.name}
              className={`relative p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] cursor-default group overflow-hidden
                ${isPos 
                  ? 'border-profit/20 hover:border-profit/40' 
                  : 'border-loss/20 hover:border-loss/40'}`}
              style={{
                 backgroundColor: isPos 
                   ? `rgba(34, 197, 94, ${intensity / 500})` 
                   : `rgba(239, 68, 68, ${intensity / 500})`
              }}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{sector.name}</span>
                  <span className={`text-xs font-mono font-bold ${isPos ? 'text-profit' : 'text-loss'}`}>
                    {isPos ? '+' : ''}{sector.avgChange.toFixed(2)}%
                  </span>
                </div>
                <div className="mt-4">
                    <p className="text-[10px] text-muted mb-0.5">Top Performer</p>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-primary">{sector.topStock?.symbol}</span>
                            {sector.topStock?.isUp ? (
                                <TrendingUp className="w-3 h-3 text-profit" />
                            ) : (
                                <TrendingDown className="w-3 h-3 text-loss" />
                            )}
                        </div>
                </div>
              </div>
              
              {/* Performance Indicator Bar */}
              <div className={`absolute bottom-0 left-0 h-1 transition-all duration-700
                ${isPos ? 'bg-profit' : 'bg-loss'}`}
                style={{ width: `${Math.min(Math.abs(sector.avgChange) * 20, 100)}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
