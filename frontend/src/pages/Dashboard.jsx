import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getAllStocks, getOrders, getHoldings, getBalance,
  cancelOrder,
} from '../services/api';
import { getSocket } from '../services/socket';
import OrderBook        from '../components/dashboard/OrderBook';
import ChartPanel       from '../components/dashboard/ChartPanel';
import BuySellPanel     from '../components/dashboard/BuySellPanel';
import ActiveOrders     from '../components/dashboard/ActiveOrders';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import AIPredictionCard from '../components/dashboard/AIPredictionCard';
import AlertsPanel      from '../components/dashboard/AlertsPanel';
import {

  TrendingUp, TrendingDown, DollarSign, Activity,
  BarChart2, RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const [searchParams] = useSearchParams();

  const [stocks, setStocks]               = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [livePrices, setLivePrices]       = useState({});
  const [orders, setOrders]               = useState([]);
  const [holdings, setHoldings]           = useState([]);
  const [balance, setBalance]             = useState(0);
  const [refreshKey, setRefreshKey]       = useState(0);

  // ── Fetch stocks ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res  = await getAllStocks();
        const list = res.data.stocks || [];
        setStocks(list);

        const priceMap = {};
        list.forEach(s => { if (s.price) priceMap[s.symbol] = s.price; });
        setLivePrices(priceMap);

        const urlSymbol = searchParams.get('stock');
        const target = urlSymbol
          ? list.find(s => s.symbol === urlSymbol) || list[0]
          : list[0];
        if (target) setSelectedStock(target);
      } catch {
        const fallback = [
          { symbol: 'RELIANCE', name: 'Reliance Industries',       price: 2450 },
          { symbol: 'TCS',      name: 'Tata Consultancy Services', price: 3680 },
          { symbol: 'INFY',     name: 'Infosys',                   price: 1420 },
          { symbol: 'HDFC',     name: 'HDFC Bank',                 price: 1580 },
          { symbol: 'ICICI',    name: 'ICICI Bank',                price:  960 },
          { symbol: 'SBIN',     name: 'State Bank of India',       price:  650 },
        ];
        setStocks(fallback);
        setSelectedStock(fallback[0]);
        const priceMap = {};
        fallback.forEach(s => { priceMap[s.symbol] = s.price; });
        setLivePrices(priceMap);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── React to ?stock= URL param ────────────────────────────────
  useEffect(() => {
    const sym = searchParams.get('stock');
    if (sym && stocks.length > 0) {
      const s = stocks.find(x => x.symbol === sym);
      if (s) {
        // Defer to avoid "synchronous setState in effect" lint rule
        const t = setTimeout(() => setSelectedStock(s), 0);
        return () => clearTimeout(t);
      }


    }
  }, [searchParams, stocks]);

  // ── Fetch orders / holdings / balance ─────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [oRes, hRes, bRes] = await Promise.allSettled([
        getOrders(), getHoldings(), getBalance(),
      ]);
      if (oRes.status === 'fulfilled') {
        const d = oRes.value.data;
        setOrders(Array.isArray(d) ? d : d?.orders || []);
      }
      if (hRes.status === 'fulfilled') setHoldings(hRes.value.data?.holdings || []);
      if (bRes.status === 'fulfilled') setBalance(bRes.value.data?.balance  ?? 0);
    } catch {
      // ignore
    }
  }, []);

  // Defer to avoid "synchronous setState in effect" lint rule
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0);
    return () => clearTimeout(t);
  }, [fetchData, refreshKey]);

  const handleOrderPlaced = () => setRefreshKey(k => k + 1);
  const handleCancelOrder = async (id) => {
    try { await cancelOrder(id); setRefreshKey(k => k + 1); } catch {
      // ignore
    }
  };


  // ── WebSocket live prices ──────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (prices) => setLivePrices(prev => ({ ...prev, ...prices }));
    socket.on('price_update', handler);
    return () => socket.off('price_update', handler);
  }, []);

  const currentPrice = selectedStock
    ? (livePrices[selectedStock.symbol] || selectedStock.price || 0)
    : 0;

  // ── Stats ──────────────────────────────────────────────────────
  const totalInvested = holdings.reduce((s, h) => s + h.avgPrice * Math.abs(h.quantity), 0);
  const totalCurrent  = holdings.reduce((s, h) => {
    const cur = livePrices[h.stock] || h.currentPrice || 0;
    return s + cur * Math.abs(h.quantity);
  }, 0);
  const totalPnl        = totalCurrent - totalInvested;
  const totalPnlPct     = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const pendingOrders   = orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="h-full flex flex-col gap-2 px-2 pb-2 pt-3 animate-fade-in overflow-hidden">

      {/* ── Stats Bar ── */}
      <div className="flex-none grid grid-cols-3 sm:grid-cols-6 gap-2 items-stretch">
        <StatCard label="Balance"
          value={`₹${(balance / 1000).toFixed(1)}K`}
          icon={<DollarSign className="w-3 h-3" />}
          color="text-accent" />
        <StatCard label="Invested"
          value={`₹${(totalInvested / 1000).toFixed(1)}K`}
          icon={<BarChart2 className="w-3 h-3" />}
          color="text-secondary" />
        <StatCard label="P&L"
          value={`${totalPnl >= 0 ? '+' : ''}₹${Math.abs(totalPnl / 1000).toFixed(1)}K`}
          sub={`${totalPnlPct >= 0 ? '+' : ''}${totalPnlPct.toFixed(1)}%`}
          icon={totalPnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          color={totalPnl >= 0 ? 'text-profit' : 'text-loss'}
          pnl={totalPnl} />
        <StatCard label="LTP"
          value={`₹${currentPrice.toFixed(2)}`}
          icon={<Activity className="w-3 h-3" />}
          color="text-primary" />
        <StatCard label="In Profit"
          value={holdings.filter(h => {
            const c = livePrices[h.stock] || h.currentPrice || 0;
            return c > h.avgPrice;
          }).length}
          icon={<TrendingUp className="w-3 h-3" />}
          color="text-profit" />
        <StatCard label="Completed"
          value={completedOrders}
          sub={pendingOrders > 0 ? `${pendingOrders} pending` : ''}
          icon={<BarChart2 className="w-3 h-3" />}
          color="text-accent"
          action={
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-0.5 hover:text-accent transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          } />
      </div>

      {/* ── Main Row: OrderBook | Chart | BuySell ── */}
      <div className="min-h-0 grid grid-cols-12 gap-2 items-stretch" style={{ flex: '72 72 0' }}>

        {/* Order Book — 2 cols */}
        <div className="col-span-12 lg:col-span-2 min-w-0 min-h-0 h-full">
          <OrderBook
            selectedStock={selectedStock}
            livePrices={livePrices}
            orders={orders}
          />
        </div>

        {/* Chart Panel — 8 cols */}
        <div className="col-span-12 lg:col-span-8 min-w-0 min-h-0 h-full">
          <ChartPanel
            selectedStock={selectedStock}
            stocks={stocks}
            onStockChange={setSelectedStock}
            currentPrice={currentPrice}
            livePrices={livePrices}
          />
        </div>

        {/* Buy/Sell Panel — 2 cols */}
        <div className="col-span-12 lg:col-span-2 min-w-0 self-start">
          <BuySellPanel
            selectedStock={selectedStock}
            currentPrice={currentPrice}
            onOrderPlaced={handleOrderPlaced}
            userBalance={balance}
          />
        </div>

      </div>

      {/* ── Bottom Row: Portfolio | Orders | AI Card ── */}
      <div className="min-h-0 grid grid-cols-12 gap-2 items-stretch" style={{ flex: '28 28 0' }}>

        {/* Portfolio — 2 cols */}
        <div className="col-span-12 md:col-span-2 min-w-0 min-h-0 h-full">
          <PortfolioSummary
            holdings={holdings}
            livePrices={livePrices}
          />
        </div>

        {/* Active Orders — 6 cols */}
        <div className="col-span-12 md:col-span-6 min-w-0 min-h-0 h-full">
          <ActiveOrders
            orders={orders}
            onCancel={handleCancelOrder}
          />
        </div>

        {/* Alerts — 2 cols */}
        <div className="col-span-12 md:col-span-2 min-w-0 min-h-0 h-full">
          <AlertsPanel
            selectedStock={selectedStock}
            currentPrice={currentPrice}
          />
        </div>

        {/* AI Prediction — 2 cols */}
        <div className="col-span-12 md:col-span-2 min-w-0 min-h-0 h-full">

          <AIPredictionCard
            selectedStock={selectedStock}
            currentPrice={currentPrice}
            holdings={holdings}
          />
        </div>

      </div>

    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color, pnl, action }) {
  return (
    <div className="bg-card border border-edge rounded-xl px-3 py-2 flex items-center gap-2 min-w-0 h-full">
      <div className={`shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] text-muted truncate">{label}</div>
        <div className={`text-[11px] font-bold font-mono truncate ${color}`}>{value}</div>
        {sub && (
          <div className={`text-[9px] font-mono truncate ${
            pnl !== undefined ? (pnl >= 0 ? 'text-profit' : 'text-loss') : 'text-muted'
          }`}>
            {sub}
          </div>
        )}
      </div>
      {action && <div className="shrink-0 text-muted">{action}</div>}
    </div>
  );
}
