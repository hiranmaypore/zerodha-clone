import { useState, useEffect } from 'react';
import { getPortfolioAnalytics } from '../../services/api';
import { PieChart, Shield, TrendingUp, AlertTriangle, BarChart3, Target } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';

const SECTOR_COLORS = [
  '#7C3AED', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#06B6D4', '#8B5CF6', '#84CC16',
  '#EC4899', '#14B8A6',
];

export default function PortfolioAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPortfolioAnalytics();
        setAnalytics(res.data.analytics);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="bg-card border border-edge rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-surface rounded w-1/3 mb-4" />
      <div className="h-40 bg-surface rounded" />
    </div>
  );

  if (!analytics || analytics.holdingsCount === 0) return null;

  const { sectorAllocation, riskMetrics } = analytics;

  const pieData = sectorAllocation.map((s, i) => ({
    name: s.sector,
    value: s.percent,
    fill: SECTOR_COLORS[i % SECTOR_COLORS.length],
  }));

  const riskColor = (val, thresholds) => {
    if (val >= thresholds[1]) return 'text-profit';
    if (val >= thresholds[0]) return 'text-warning';
    return 'text-loss';
  };

  return (
    <div className="bg-card border border-edge rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-edge flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-primary">Portfolio Analytics</span>
        <span className="ml-auto text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">PRO</span>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Sector Pie Chart */}
        <div>
          <p className="text-xs text-muted font-bold uppercase tracking-wider mb-3">Sector Allocation</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      return (
                        <div className="bg-card border border-edge p-2 rounded-lg shadow-xl text-xs">
                          <p className="text-primary font-bold">{payload[0].name}</p>
                          <p className="text-muted">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {sectorAllocation.slice(0, 6).map((s, i) => (
              <div key={s.sector} className="flex items-center gap-1.5 text-[10px] text-muted">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }} />
                {s.sector} <span className="text-muted/60">{s.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Metrics */}
        <div className="space-y-4">
          <p className="text-xs text-muted font-bold uppercase tracking-wider mb-1">Risk Dashboard</p>

          <MetricRow 
            label="Sharpe Ratio"
            value={riskMetrics.sharpeRatio}
            icon={<TrendingUp className="w-3.5 h-3.5" />}
            desc="Risk-adjusted return (>1 is good)"
            colorClass={riskColor(riskMetrics.sharpeRatio, [0.5, 1.0])}
          />
          <MetricRow 
            label="Portfolio Beta"
            value={riskMetrics.beta}
            icon={<Target className="w-3.5 h-3.5" />}
            desc={riskMetrics.beta > 1 ? 'Above market risk' : 'Below market risk'}
            colorClass={riskMetrics.beta > 1.2 ? 'text-loss' : riskMetrics.beta < 0.8 ? 'text-profit' : 'text-warning'}
          />
          <MetricRow 
            label="Diversification"
            value={`${riskMetrics.diversificationScore}/100`}
            icon={<PieChart className="w-3.5 h-3.5" />}
            desc={riskMetrics.diversificationScore > 60 ? 'Well diversified' : 'Consider diversifying'}
            colorClass={riskColor(riskMetrics.diversificationScore, [30, 60])}
          />
          <MetricRow 
            label="Concentration Risk"
            value={`${riskMetrics.concentrationRisk}%`}
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
            desc={`Top: ${riskMetrics.topHolding}`}
            colorClass={riskMetrics.concentrationRisk > 50 ? 'text-loss' : riskMetrics.concentrationRisk > 30 ? 'text-warning' : 'text-profit'}
          />

          <div className="mt-4 p-3 bg-surface/50 rounded-xl border border-edge">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Risk Summary</p>
            <p className="text-[11px] text-primary leading-relaxed">
              {riskMetrics.diversificationScore > 60 && riskMetrics.sharpeRatio > 0.5
                ? '✅ Your portfolio has healthy diversification and positive risk-adjusted returns.'
                : riskMetrics.concentrationRisk > 50
                  ? '⚠️ High concentration in a single stock. Consider rebalancing to reduce risk.'
                  : '📊 Consider spreading your holdings across more sectors for better risk management.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, icon, desc, colorClass }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-surface/30 rounded-xl border border-edge/50">
      <div className={`p-2 rounded-lg bg-surface ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted font-medium">{label}</span>
          <span className={`text-sm font-bold font-mono ${colorClass}`}>{value}</span>
        </div>
        <p className="text-[9px] text-muted/70 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
