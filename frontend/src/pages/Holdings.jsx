import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StockIcon } from '../components/StockIcon';
import { getHoldings, getPositions, downloadTaxStatement } from '../services/api';
import toast from 'react-hot-toast';
import { connectSocket } from '../services/socket';
import {
  TrendingUp, TrendingDown, Briefcase, BarChart2,
  ArrowUpRight, ArrowDownRight, Minus, RefreshCw, Activity, Download
} from 'lucide-react';

export default function Holdings() {
  const navigate  = useNavigate();
  const [tab,      setTab]     = useState('holdings'); // 'holdings' | 'positions'
  const [holdings, setHoldings] = useState([]);
  const [positions, setPositions] = useState([]);
  const [prices,   setPrices]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [sort,     setSort]     = useState({ key: 'pnl', dir: -1 });

  useEffect(() => {
    load();
    const socket = connectSocket();
    socket.on('price_update', (incoming) =>
      setPrices(prev => ({ ...prev, ...incoming }))
    );
    return () => socket.off('price_update');
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [hRes, pRes] = await Promise.allSettled([getHoldings(), getPositions()]);
      if (hRes.status === 'fulfilled') {
        const list = hRes.value.data.holdings || [];
        setHoldings(list);
        const seed = {};
        list.forEach(h => { if (h.currentPrice) seed[h.stock] = h.currentPrice; });
        setPrices(prev => ({ ...seed, ...prev }));
      }
      if (pRes.status === 'fulfilled') {
        setPositions(pRes.value.data.positions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  // ── Enrich with live prices ──────────────────────────────────
  const enriched = holdings.map(h => {
    const livePrice    = prices[h.stock] ?? h.currentPrice ?? 0;
    const qty          = Math.abs(h.quantity);
    const investedVal  = h.avgPrice * qty;
    const currentVal   = livePrice  * qty;
    const pnl          = h.quantity > 0 ? currentVal - investedVal : investedVal - currentVal;
    const pnlPct       = investedVal > 0 ? (pnl / investedVal) * 100 : 0;
    return { ...h, livePrice, qty, investedVal, currentVal, pnl, pnlPct };
  });

  // ── Sort ────────────────────────────────────────────────────
  const sorted = [...enriched].sort((a, b) => {
    const av = a[sort.key] ?? 0;
    const bv = b[sort.key] ?? 0;
    return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
  });

  const toggleSort = (key) =>
    setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }));

  // ── Totals ──────────────────────────────────────────────────
  const totalInvested = enriched.reduce((s, h) => s + h.investedVal,  0);
  const totalCurrent  = enriched.reduce((s, h) => s + h.currentVal,   0);
  const totalPnl      = totalCurrent - totalInvested;
  const totalPnlPct   = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const winners       = enriched.filter(h => h.pnl >= 0).length;
  const losers        = enriched.length - winners;

  // ── Allocation % per stock ───────────────────────────────────
  const alloc = (val) => totalCurrent > 0 ? (val / totalCurrent) * 100 : 0;

  const fmt = (n) =>
    Math.abs(n) >= 1e5
      ? `₹${(n / 1e5).toFixed(2)}L`
      : Math.abs(n) >= 1e3
        ? `₹${(n / 1e3).toFixed(1)}K`
        : `₹${n.toFixed(2)}`;

  const SortIcon = ({ col }) =>
    sort.key === col
      ? sort.dir === 1
        ? <ArrowUpRight className="w-3 h-3 inline text-accent" />
        : <ArrowDownRight className="w-3 h-3 inline text-accent" />
      : <Minus className="w-3 h-3 inline text-muted/30" />;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Portfolio</h1>
          <p className="text-sm text-muted mt-0.5">Manage your investments and intraday trades</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const toastId = toast.loading('Generating tax statement...');
                const res = await downloadTaxStatement();
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Tax_Statement_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                toast.success('Downloaded Tax Statement CSV', { id: toastId });
              } catch {
                toast.error('Failed to export tax data');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Statement
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-edge text-xs text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 bg-surface/50 p-1 rounded-xl border border-edge w-fit">
        <button
          onClick={() => setTab('holdings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'holdings'
              ? 'bg-accent text-white shadow-lg'
              : 'text-muted hover:text-primary'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Holdings <span className="text-xs opacity-70">({enriched.length})</span>
        </button>
        <button
          onClick={() => setTab('positions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'positions'
              ? 'bg-warning/80 text-dark shadow-lg'
              : 'text-muted hover:text-primary'
          }`}
        >
          <Activity className="w-4 h-4" />
          Positions <span className="text-xs opacity-70">({positions.length})</span>
        </button>
      </div>

      {/* ── POSITIONS view (MIS intraday) ── */}
      {tab === 'positions' && (
        <>
          {positions.length > 0 ? (
            <div className="bg-card border border-edge rounded-xl overflow-x-auto">
              <div className="px-5 py-3 border-b border-edge flex items-center gap-2 min-w-[500px]">
                <Activity className="w-4 h-4 text-warning" />
                <span className="text-sm font-semibold text-primary">Today's Intraday Positions (MIS)</span>
                <span className="text-xs text-warning/80 bg-warning/10 px-2 py-0.5 rounded-full ml-auto">Auto square-off at 3:20 PM</span>
              </div>
              <table className="w-full text-sm min-w-[500px] md:min-w-0">
                <thead>
                  <tr className="border-b border-edge text-[10px] text-muted uppercase tracking-wide">
                    <th className="text-left px-5 py-3 font-medium">Stock</th>
                    <th className="text-right px-4 py-3 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 font-medium">Avg Price</th>
                    <th className="text-right px-4 py-3 font-medium">LTP</th>
                    <th className="text-right px-5 py-3 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {positions.map(p => (
                    <tr key={p._id} onClick={() => navigate(`/dashboard?stock=${p.stock}`)} className="hover:bg-surface/60 transition-colors cursor-pointer">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <StockIcon symbol={p.stock} className="w-8 h-8" textSize="text-xs" />
                          <div>
                            <div className="font-semibold text-primary">{p.stock}</div>
                            <div className="text-[10px] text-warning bg-warning/10 px-1.5 py-0.5 rounded-full inline-block">MIS</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right px-4 py-3.5 font-mono text-primary">{Math.abs(p.quantity)}</td>
                      <td className="text-right px-4 py-3.5 font-mono text-secondary">₹{p.avgPrice?.toFixed(2)}</td>
                      <td className="text-right px-4 py-3.5 font-mono font-semibold text-primary">₹{(prices[p.stock] ?? p.currentPrice ?? 0).toFixed(2)}</td>
                      <td className="text-right px-5 py-3.5">
                        <div className={`font-semibold font-mono text-sm ${p.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {p.pnl >= 0 ? '+' : ''}{fmt(p.pnl)}
                        </div>
                        <div className={`text-[10px] font-mono ${p.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {p.pnlPercent >= 0 ? '+' : ''}{p.pnlPercent?.toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-card border border-edge rounded-xl py-20 text-center space-y-4">
              <Activity className="w-12 h-12 mx-auto text-muted/20" />
              <div>
                <p className="text-primary font-semibold">No intraday positions today</p>
                <p className="text-sm text-muted mt-1">Use MIS product type when placing orders for intraday trading</p>
              </div>
              <button onClick={() => navigate('/dashboard')} className="px-5 py-2 bg-warning/80 text-dark rounded-xl text-sm font-medium hover:bg-warning transition-colors">
                Trade Intraday
              </button>
            </div>
          )}
        </>
      )}

      {/* ── HOLDINGS view (CNC long-term) ── */}
      {tab === 'holdings' && enriched.length > 0 ? (

        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard
              label="Invested"
              value={fmt(totalInvested)}
              icon={<Briefcase className="w-4 h-4" />}
              color="text-secondary"
            />
            <SummaryCard
              label="Current Value"
              value={fmt(totalCurrent)}
              icon={<BarChart2 className="w-4 h-4" />}
              color="text-primary"
            />
            <SummaryCard
              label="Total P&L"
              value={`${totalPnl >= 0 ? '+' : ''}${fmt(totalPnl)}`}
              sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(2)}%`}
              icon={totalPnl >= 0
                ? <TrendingUp className="w-4 h-4" />
                : <TrendingDown className="w-4 h-4" />}
              color={totalPnl >= 0 ? 'text-profit' : 'text-loss'}
              pnl={totalPnl}
            />
            <SummaryCard
              label="Winners / Losers"
              value={`${winners} / ${losers}`}
              sub={`${enriched.length} positions`}
              icon={<TrendingUp className="w-4 h-4" />}
              color="text-profit"
            />
          </div>

          {/* ── Portfolio allocation bar ── */}
          <div className="bg-card border border-edge rounded-xl p-4">
            <p className="text-xs text-muted mb-2 font-medium">Portfolio Allocation</p>
            <div className="flex h-3 rounded-full overflow-hidden gap-px">
              {sorted.slice(0, 8).map((h, i) => {
                const COLORS = [
                  'bg-purple-500','bg-blue-500','bg-emerald-500','bg-amber-500',
                  'bg-rose-500','bg-cyan-500','bg-indigo-500','bg-lime-500'
                ];
                return (
                  <div
                    key={h.stock}
                    className={`${COLORS[i % COLORS.length]} transition-all`}
                    style={{ width: `${alloc(h.currentVal)}%` }}
                    title={`${h.stock}: ${alloc(h.currentVal).toFixed(1)}%`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              {sorted.slice(0, 8).map((h, i) => {
                const COLORS = [
                  'bg-purple-500','bg-blue-500','bg-emerald-500','bg-amber-500',
                  'bg-rose-500','bg-cyan-500','bg-indigo-500','bg-lime-500'
                ];
                return (
                  <div key={h.stock} className="flex items-center gap-1.5 text-[10px] text-muted">
                    <div className={`w-2 h-2 rounded-full ${COLORS[i % COLORS.length]}`} />
                    {h.stock} <span className="text-muted/60">{alloc(h.currentVal).toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Holdings table ── */}
          <div className="bg-card border border-edge rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[500px] md:min-w-0">
              <thead>
                <tr className="border-b border-edge text-[10px] text-muted uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Stock</th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('qty')}
                  >
                    Qty <SortIcon col="qty" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('avgPrice')}
                  >
                    Avg <SortIcon col="avgPrice" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('livePrice')}
                  >
                    LTP <SortIcon col="livePrice" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none hidden md:table-cell"
                    onClick={() => toggleSort('investedVal')}
                  >
                    Invested <SortIcon col="investedVal" />
                  </th>
                  <th
                    className="text-right px-4 py-3 font-medium cursor-pointer hover:text-primary select-none hidden md:table-cell"
                    onClick={() => toggleSort('currentVal')}
                  >
                    Current <SortIcon col="currentVal" />
                  </th>
                  <th
                    className="text-right px-5 py-3 font-medium cursor-pointer hover:text-primary select-none"
                    onClick={() => toggleSort('pnl')}
                  >
                    P&L <SortIcon col="pnl" />
                  </th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Alloc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {sorted.map(h => (
                  <tr
                    key={h._id}
                    onClick={() => navigate(`/dashboard?stock=${h.stock}`)}
                    className="hover:bg-surface/60 transition-colors cursor-pointer group"
                  >
                    {/* Stock */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <StockIcon symbol={h.stock} className="w-8 h-8" textSize="text-xs" />
                        <div>
                          <div className="font-semibold text-primary">{h.stock}</div>
                          <div className="text-[10px] text-muted truncate max-w-[120px]">{h.name}</div>
                        </div>
                        {h.isShort && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-loss/15 text-loss rounded-full font-semibold">SHORT</span>
                        )}
                      </div>
                    </td>

                    {/* Qty */}
                    <td className="text-right px-4 py-3.5 font-mono text-primary">{h.qty}</td>

                    {/* Avg */}
                    <td className="text-right px-4 py-3.5 font-mono text-secondary">₹{h.avgPrice?.toFixed(2)}</td>

                    {/* LTP */}
                    <td className="text-right px-4 py-3.5 font-mono font-semibold text-primary">
                      ₹{h.livePrice?.toFixed(2)}
                    </td>

                    {/* Invested */}
                    <td className="text-right px-4 py-3.5 font-mono text-secondary hidden md:table-cell">
                      {fmt(h.investedVal)}
                    </td>

                    {/* Current */}
                    <td className="text-right px-4 py-3.5 font-mono text-primary hidden md:table-cell">
                      {fmt(h.currentVal)}
                    </td>

                    {/* P&L */}
                    <td className="text-right px-5 py-3.5">
                      <div className={`font-semibold font-mono ${h.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {h.pnl >= 0 ? '+' : ''}{fmt(h.pnl)}
                      </div>
                      <div className={`text-[10px] font-mono ${h.pnlPct >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {h.pnlPct >= 0 ? '+' : ''}{h.pnlPct?.toFixed(2)}%
                      </div>
                    </td>

                    {/* Allocation bar */}
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-2 justify-end">
                        <div className="w-16 h-1.5 bg-surface rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${h.pnl >= 0 ? 'bg-profit' : 'bg-loss'}`}
                            style={{ width: `${Math.min(100, alloc(h.currentVal))}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted w-8 text-right">
                          {alloc(h.currentVal).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Table footer totals */}
            <div className="border-t border-edge px-5 py-3 flex flex-wrap gap-6 text-xs">
              <span className="text-muted">
                Total Invested: <span className="text-primary font-semibold font-mono">{fmt(totalInvested)}</span>
              </span>
              <span className="text-muted">
                Current Value: <span className="text-primary font-semibold font-mono">{fmt(totalCurrent)}</span>
              </span>
              <span className="text-muted">
                Overall P&L:{' '}
                <span className={`font-semibold font-mono ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {totalPnl >= 0 ? '+' : ''}{fmt(totalPnl)} ({totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(2)}%)
                </span>
              </span>
            </div>
          </div>
        </>
      ) : tab === 'holdings' && enriched.length === 0 ? (
        <div className="bg-card border border-edge rounded-xl py-20 text-center space-y-4">
          <Briefcase className="w-12 h-12 mx-auto text-muted/20" />
          <div>
            <p className="text-primary font-semibold">No holdings yet</p>
            <p className="text-sm text-muted mt-1">Buy stocks using CNC from the dashboard to see them here</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent/80 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ label, value, sub, icon, color, pnl }) {
  return (
    <div className="bg-card border border-edge rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
      {sub && (
        <div className={`text-xs font-mono mt-0.5 ${
          pnl !== undefined ? (pnl >= 0 ? 'text-profit' : 'text-loss') : 'text-muted'
        }`}>
          {sub}
        </div>
      )}
    </div>
  );
}
