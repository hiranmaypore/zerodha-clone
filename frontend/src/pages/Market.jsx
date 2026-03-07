import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllStocks, buyOrder, sellOrder } from '../services/api';
import { connectSocket } from '../services/socket';
import { useWatchlist } from '../hooks/useWatchlist';
import { StockIcon } from '../components/StockIcon';
import {
  TrendingUp, TrendingDown, Search, Star, X,
  ArrowUpRight, ArrowDownRight, Minus,
  BarChart2, Activity, Zap, RefreshCw,
} from 'lucide-react';
import OptionChain from '../components/market/OptionChain';
import SectorHeatmap from '../components/market/SectorHeatmap';

// Sector colors (mapping remains for styling)
const SECTOR_COLORS = {
  IT: 'bg-blue-500/15 text-blue-300',
  Banking: 'bg-purple-500/15 text-purple-300',
  Energy: 'bg-amber-500/15 text-amber-300',
  Telecom: 'bg-cyan-500/15 text-cyan-300',
  FMCG: 'bg-green-500/15 text-green-300',
  Pharma: 'bg-rose-500/15 text-rose-300',
  Infra: 'bg-orange-500/15 text-orange-300',
  Finance: 'bg-indigo-500/15 text-indigo-300',
  Auto: 'bg-teal-500/15 text-teal-300',
  Consumer: 'bg-pink-500/15 text-pink-300',
  Cement: 'bg-stone-500/15 text-stone-300',
};

export default function Market() {
  const navigate = useNavigate();
  const [stocks,  setStocks]  = useState([]);
  const [prices,  setPrices]  = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [search,  setSearch]  = useState('');
  const [loading, setLoading] = useState(true);
  const [sort,    setSort]    = useState({ key: 'symbol', dir: 1 });
  const [sectorFilter, setSectorFilter] = useState('ALL');
  const [tab,     setTab]     = useState('ALL'); // ALL | GAINERS | LOSERS | WATCHLIST
  const [modal,   setModal]   = useState(null);
  const [qty,     setQty]     = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPx, setLimitPx] = useState('');
  const [placing, setPlacing] = useState(false);
  const [toast,   setToast]   = useState(null);

  const { isWatched, toggle: toggleWatch } = useWatchlist();

  useEffect(() => {
    load();
    const socket = connectSocket();
    socket.on('price_update', (incoming) => {
      setPrices(currentPrices => ({ ...currentPrices, ...incoming }));
    });
    return () => socket.off('price_update');
  }, []);


  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllStocks();
      const list = res.data.stocks || [];
      setStocks(list);
      const seed = {};
      const opens = {};
      list.forEach(s => { 
        if (s.price) seed[s.symbol] = s.price; 
        if (s.openingPrice) opens[s.symbol] = s.openingPrice;
      });
      setPrices(seed);
      setPrevPrices(opens); // Backend-driven baseline
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Enrich ──────────────────────────────────────────────────
  const enriched = useMemo(() => stocks.map(s => {
    const price  = prices[s.symbol] || s.price || 0;
    const open   = prevPrices[s.symbol] || price;
    const change = price - open;
    const changePct = open > 0 ? (change / open) * 100 : 0;
    return {
      ...s,
      price,
      open,
      change,
      changePct,
      sector: s.sector || 'Other',
      isUp:   changePct >  0.01,
      isDown: changePct < -0.01,
    };
  }), [stocks, prices, prevPrices]);

  // ── Stats ────────────────────────────────────────────────────
  const gainers = enriched.filter(s => s.isUp).length;
  const losers  = enriched.filter(s => s.isDown).length;
  const topGainer = [...enriched].sort((a,b) => b.changePct - a.changePct)[0];
  const topLoser  = [...enriched].sort((a,b) => a.changePct - b.changePct)[0];

  // Simulated NIFTY-like index (average of all prices weighted)
  const avgChange = enriched.length
    ? enriched.reduce((s,x) => s + x.changePct, 0) / enriched.length
    : 0;

  // ── Filter + sort ────────────────────────────────────────────
  const sectors = ['ALL', ...new Set(enriched.map(s => s.sector))].sort();

  const filtered = useMemo(() => {
    let list = enriched;
    if (tab === 'GAINERS')   list = list.filter(s => s.isUp);
    if (tab === 'LOSERS')    list = list.filter(s => s.isDown);
    if (tab === 'WATCHLIST') list = list.filter(s => isWatched(s.symbol));
    if (sectorFilter !== 'ALL') list = list.filter(s => s.sector === sectorFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      const av = a[sort.key] ?? 0;
      const bv = b[sort.key] ?? 0;
      return (typeof av === 'string' ? av.localeCompare(bv) : av < bv ? -1 : av > bv ? 1 : 0) * sort.dir;
    });
  }, [enriched, tab, sectorFilter, search, sort, isWatched]);

  const toggleSort = (key) =>
    setSort(s => ({ key, dir: s.key === key ? -s.dir : 1 }));

  // ── Order ────────────────────────────────────────────────────
  const openModal = (stock, action) => {
    setModal({ stock, action });
    setQty(''); setOrderType('MARKET'); setLimitPx('');
  };

  const placeOrder = async () => {
    if (!qty || qty <= 0) return;
    setPlacing(true);
    try {
      const payload = { 
        stockSymbol: modal.stock.symbol, 
        quantity: parseInt(qty), 
        orderType,
        quotedPrice: modal.stock.isOption ? modal.stock.price : undefined 
      };
      if (orderType === 'LIMIT') payload.limitPrice = parseFloat(limitPx);
      modal.action === 'BUY' ? await buyOrder(payload) : await sellOrder(payload);
      showToast(`✅ ${modal.action} order placed for ${modal.stock.symbol}`, 'success');
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Order failed', 'error');
    } finally {
      setPlacing(false);
    }
  };

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fmt = (n) =>
    Math.abs(n) >= 1e5 ? `₹${(n/1e5).toFixed(2)}L` :
    Math.abs(n) >= 1e3 ? `₹${(n/1e3).toFixed(1)}K` :
    `₹${n.toFixed(2)}`;

  const SortArrow = ({ col }) => {
    if (sort.key !== col) return <Minus className="w-3 h-3 inline text-muted/30" />;
    return sort.dir === 1
      ? <ArrowUpRight   className="w-3 h-3 inline text-accent" />
      : <ArrowDownRight className="w-3 h-3 inline text-accent" />;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const modalPrice = modal ? (prices[modal.stock.symbol] || modal.stock.price || 0) : 0;
  const modalTotal = qty > 0 ? (orderType === 'LIMIT' ? parseFloat(limitPx||0) : modalPrice) * parseInt(qty||0) : 0;
  const currentMarketAvg = avgChange;

  return (

    <div className="space-y-5 animate-fade-in">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-fade-in
          ${toast.type==='success' ? 'bg-profit/10 border-profit/20 text-profit'
          : toast.type==='error'   ? 'bg-loss/10   border-loss/20   text-loss'
          :                          'bg-card       border-edge       text-primary'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Markets</h1>
          <p className="text-sm text-muted mt-0.5">{stocks.length} stocks · Live prices</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search stocks…"
              className="pl-9 pr-4 py-2 bg-card border border-edge rounded-xl text-sm text-primary placeholder-muted focus:border-accent outline-none w-56 transition-all focus:w-72"
            />
          </div>
          <button onClick={load} className="p-2 rounded-xl bg-card border border-edge text-muted hover:text-primary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Sector Heatmap ── */}
      <SectorHeatmap stocks={enriched} />

      {/* ── Market Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-edge rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted uppercase tracking-wide">NIFTY (sim)</span>
            <Activity className="w-3.5 h-3.5 text-muted" />
          </div>
          <div className={`text-lg font-bold font-mono ${avgChange >= 0 ? 'text-profit' : 'text-loss'}`}>
            {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
          </div>
          <div className="text-[10px] text-muted mt-0.5">Market average</div>
        </div>
        <div className="bg-card border border-edge rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted uppercase tracking-wide">Gainers / Losers</span>
            <BarChart2 className="w-3.5 h-3.5 text-muted" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-profit">{gainers}</span>
            <span className="text-muted">/</span>
            <span className="text-lg font-bold text-loss">{losers}</span>
          </div>
          <div className="h-1 bg-surface rounded-full mt-2 overflow-hidden flex">
            <div className="bg-profit h-full" style={{ width: `${(gainers/stocks.length)*100}%` }} />
            <div className="bg-loss   h-full" style={{ width: `${(losers /stocks.length)*100}%` }} />
          </div>
        </div>
        <div
          className="bg-card border border-edge rounded-xl p-4 cursor-pointer hover:border-profit/40 transition-colors"
          onClick={() => topGainer && navigate(`/dashboard?stock=${topGainer.symbol}`)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted uppercase tracking-wide">Top Gainer</span>
            <TrendingUp className="w-3.5 h-3.5 text-profit" />
          </div>
          <div className="text-sm font-bold text-primary">{topGainer?.symbol}</div>
          <div className="text-profit text-xs font-mono font-semibold">
            +{topGainer?.changePct.toFixed(2)}%
          </div>
        </div>
        <div
          className="bg-card border border-edge rounded-xl p-4 cursor-pointer hover:border-loss/40 transition-colors"
          onClick={() => topLoser && navigate(`/dashboard?stock=${topLoser.symbol}`)}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-muted uppercase tracking-wide">Top Loser</span>
            <TrendingDown className="w-3.5 h-3.5 text-loss" />
          </div>
          <div className="text-sm font-bold text-primary">{topLoser?.symbol}</div>
          <div className="text-loss text-xs font-mono font-semibold">
            {topLoser?.changePct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* ── Tabs + Sector filter ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {['ALL','GAINERS','LOSERS','WATCHLIST','OPTIONS'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all
                ${tab === t ? 'bg-accent text-white' : 'bg-card border border-edge text-secondary hover:text-primary'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex gap-1 flex-wrap">
          {sectors.map(s => (
            <button
              key={s}
              onClick={() => setSectorFilter(s)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all
                ${sectorFilter === s ? 'bg-secondary text-dark' : 'bg-card border border-edge text-muted hover:text-primary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table OR Option Chain ── */}
      {tab === 'OPTIONS' ? (
        <OptionChain 
          spotPrice={(currentMarketAvg * 100) + 22000} 
          onTrade={(symbol, price, side) => {
            setModal({
              action: side, 
              stock: { symbol, name: `Options Contract (Lot size: 50)`, price, isOption: true }
            });
            setQty('50'); // Default 1 lot
          }} 
        />
      ) : (
        <div className="bg-card border border-edge rounded-xl overflow-hidden">
          {/* Headers */}

        <div className="grid grid-cols-12 px-4 md:px-5 py-2.5 text-[10px] text-muted uppercase tracking-wide border-b border-edge font-medium">
          <div className="col-span-7 md:col-span-4 cursor-pointer hover:text-primary select-none flex items-center" onClick={() => toggleSort('symbol')}>
            Stock <SortArrow col="symbol" />
          </div>
          <div className="col-span-2 hidden md:block text-center">Sector</div>
          <div className="col-span-5 md:col-span-2 text-right cursor-pointer hover:text-primary select-none flex items-center justify-end" onClick={() => toggleSort('price')}>
            Price <SortArrow col="price" />
          </div>
          <div className="col-span-2 hidden md:flex text-right cursor-pointer hover:text-primary select-none items-center justify-end" onClick={() => toggleSort('changePct')}>
            Change <SortArrow col="changePct" />
          </div>
          <div className="col-span-2 hidden md:block text-right">Actions</div>
        </div>

        {filtered.length > 0 ? (
          <div className="divide-y divide-edge">
            {filtered.map(stock => (
              <div
                key={stock.symbol}
                className="grid grid-cols-12 px-4 md:px-5 py-3 items-center hover:bg-surface/60 transition-colors group border-b border-edge last:border-b-0"
              >
                {/* Stock name */}
                <div
                  className="col-span-7 md:col-span-4 flex items-center gap-2.5 cursor-pointer"
                  onClick={() => navigate(`/dashboard?stock=${stock.symbol}`)}
                >
                  <StockIcon symbol={stock.symbol} className="w-8 h-8 md:w-8 md:h-8" textSize="text-[10px] md:text-xs" />
                  <div className="min-w-0">
                    <div className="font-semibold text-[13px] md:text-sm text-primary group-hover:text-accent transition-colors flex items-center gap-1.5 break-all">
                      {stock.symbol}
                      <span className={`md:hidden shrink-0 text-[8px] px-1.5 py-0.5 rounded font-medium ${SECTOR_COLORS[stock.sector] || 'bg-surface text-muted'}`}>
                        {stock.sector}
                      </span>
                    </div>
                    <div className="text-[9px] md:text-[10px] text-muted truncate max-w-[110px] md:max-w-[130px]">{stock.name}</div>
                  </div>
                </div>

                {/* Sector */}
                <div className="col-span-2 hidden md:flex justify-center">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${SECTOR_COLORS[stock.sector] || 'bg-surface text-muted'}`}>
                    {stock.sector}
                  </span>
                </div>

                {/* Price (Mobile embeds change) */}
                <div className="col-span-5 md:col-span-2 flex flex-col items-end justify-center">
                  <span className="font-mono font-bold text-[13px] md:text-sm text-primary">
                    ₹{stock.price.toFixed(2)}
                  </span>
                  <div className={`md:hidden flex items-center justify-end gap-0.5 text-[10px] font-mono font-semibold
                    ${stock.isUp ? 'text-profit' : stock.isDown ? 'text-loss' : 'text-muted'}`}>
                    {stock.isUp ? <ArrowUpRight className="w-3 h-3" /> : stock.isDown ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                  </div>
                </div>

                {/* Change (Desktop) */}
                <div className={`col-span-2 hidden md:flex items-center justify-end gap-1 text-xs font-mono font-semibold
                  ${stock.isUp ? 'text-profit' : stock.isDown ? 'text-loss' : 'text-muted'}`}>
                  {stock.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : stock.isDown ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                  {stock.changePct >= 0 ? '+' : ''}{stock.changePct.toFixed(2)}%
                </div>

                {/* Actions */}
                <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1 mt-3 md:mt-0">
                  {/* Watchlist star */}
                  <button
                    onClick={() => toggleWatch(stock.symbol)}
                    className="p-1.5 rounded-lg border border-edge md:border-transparent"
                    title={isWatched(stock.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                  >
                    <Star className={`w-3.5 h-3.5 ${isWatched(stock.symbol) ? 'text-warning fill-warning' : 'text-muted'}`} />
                  </button>
                  <button
                    onClick={() => openModal(stock, 'BUY')}
                    className="flex-1 md:flex-none px-2.5 py-1.5 md:py-1 rounded-lg bg-profit/10 text-profit text-xs md:text-[10px] font-bold border border-profit/20 md:border-transparent"
                  >
                    BUY
                  </button>
                  <button
                    onClick={() => openModal(stock, 'SELL')}
                    className="flex-1 md:flex-none px-2.5 py-1.5 md:py-1 rounded-lg bg-loss/10 text-loss text-xs md:text-[10px] font-bold border border-loss/20 md:border-transparent"
                  >
                    SELL
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center space-y-2">
            <Search className="w-10 h-10 mx-auto text-muted/20" />
            <p className="text-sm text-muted">No stocks match your filters</p>
          </div>
        )}
      </div>
      )}

      {/* ── Order Modal ── */}

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div
            className="bg-card border border-edge rounded-2xl p-6 w-full max-w-sm animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-primary">
                  <span className={modal.action === 'BUY' ? 'text-profit' : 'text-loss'}>{modal.action}</span>
                  {' '}{modal.stock.symbol}
                </h2>
                <p className="text-xs text-muted">{modal.stock.name}</p>
              </div>
              <button onClick={() => setModal(null)} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live price */}
            <div className="bg-surface rounded-xl px-4 py-3 mb-4 flex justify-between items-center">
              <span className="text-xs text-muted">Market Price</span>
              <span className="font-mono font-bold text-primary">₹{modalPrice.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              {/* MARKET / LIMIT toggle */}
              <div className="grid grid-cols-2 gap-2">
                {['MARKET','LIMIT'].map(t => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`py-2 rounded-xl text-sm font-medium transition-all
                      ${orderType === t ? 'bg-accent text-white' : 'bg-surface text-secondary border border-edge hover:text-primary'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Quantity */}
              <div>
                <label className="text-xs text-muted mb-1 block">Quantity</label>
                <input
                  type="number" min="1" value={qty}
                  onChange={e => setQty(e.target.value)}
                  placeholder="0"
                  className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:border-accent outline-none font-mono"
                />
              </div>

              {/* Limit price */}
              {orderType === 'LIMIT' && (
                <div>
                  <label className="text-xs text-muted mb-1 block">Limit Price (₹)</label>
                  <input
                    type="number" step="0.01" value={limitPx}
                    onChange={e => setLimitPx(e.target.value)}
                    placeholder={modalPrice.toFixed(2)}
                    className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:border-accent outline-none font-mono"
                  />
                </div>
              )}

              {/* Estimated total */}
              {qty > 0 && (
                <div className="bg-surface rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-muted">Estimated Total</span>
                  <span className="font-mono font-bold text-primary">{fmt(modalTotal)}</span>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={placeOrder}
                disabled={placing || !qty || (orderType === 'LIMIT' && !limitPx)}
                className={`w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40
                  ${modal.action === 'BUY'
                    ? 'bg-profit hover:bg-profit/80'
                    : 'bg-loss   hover:bg-loss/80'}`}
              >
                {placing
                  ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  : `${modal.action} ${modal.stock.symbol}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
