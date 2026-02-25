import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllStocks, getOrders, cancelOrder, buyOrder, sellOrder, getDashboard, getHoldings } from '../services/api';
import { getSocket, connectSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import OrderBook from '../components/dashboard/OrderBook';
import ChartPanel from '../components/dashboard/ChartPanel';
import BuySellPanel from '../components/dashboard/BuySellPanel';
import ActiveOrders from '../components/dashboard/ActiveOrders';
import AIPredictionCard from '../components/dashboard/AIPredictionCard';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import {
  TrendingUp, TrendingDown, Activity, RefreshCw, Wifi, WifiOff
} from 'lucide-react';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedSymbol = searchParams.get('stock')?.toUpperCase() || null;

  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [livePrices, setLivePrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [orders, setOrders] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const refreshTimer = useRef(null);

  // ── Fetch all initial data ──────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      // Stocks (public endpoint, always works)
      const stocksRes = await getAllStocks();
      const list = stocksRes.data.stocks || [];
      setStocks(list);
      if (list.length > 0) {
        const pick = requestedSymbol
          ? (list.find(s => s.symbol === requestedSymbol) || list[0])
          : (selectedStock ? list.find(s => s.symbol === selectedStock.symbol) || list[0] : list[0]);
        setSelectedStock(pick);
        const priceMap = {};
        list.forEach(s => { if (s.price) priceMap[s.symbol] = s.price; });
        setLivePrices(priceMap);
      }
    } catch {
      // Fallback stocks
      const fallback = [
        { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2450 },
        { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3680 },
        { symbol: 'INFY', name: 'Infosys', price: 1420 },
        { symbol: 'HDFC', name: 'HDFC Bank', price: 1580 },
        { symbol: 'ICICI', name: 'ICICI Bank', price: 960 },
        { symbol: 'SBIN', name: 'State Bank of India', price: 620 },
        { symbol: 'WIPRO', name: 'Wipro', price: 480 },
        { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 6800 },
        { symbol: 'ITC', name: 'ITC Limited', price: 430 },
        { symbol: 'TATAMOTORS', name: 'Tata Motors', price: 920 },
      ];
      setStocks(fallback);
      if (!selectedStock) {
        const pick = requestedSymbol
          ? (fallback.find(s => s.symbol === requestedSymbol) || fallback[0])
          : fallback[0];
        setSelectedStock(pick);
        const priceMap = {};
        fallback.forEach(s => { priceMap[s.symbol] = s.price; });
        setLivePrices(priceMap);
      }
    }

    // Orders + Holdings + Dashboard stats (auth-protected)
    try {
      const [ordersRes, holdingsRes, dashRes] = await Promise.allSettled([
        getOrders(),
        getHoldings(),
        getDashboard(),
      ]);
      if (ordersRes.status === 'fulfilled') {
        setOrders(Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []);
      }
      if (holdingsRes.status === 'fulfilled') {
        setHoldings(holdingsRes.value.data?.holdings || []);
      }
      if (dashRes.status === 'fulfilled') {
        setDashStats(dashRes.value.data?.dashboard || null);
      }
    } catch { /* silent */ }

    setLoading(false);
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── When URL ?stock param changes, switch selected stock instantly ──
  useEffect(() => {
    if (!requestedSymbol || stocks.length === 0) return;
    const match = stocks.find(s => s.symbol === requestedSymbol);
    if (match) {
      const livePrice = livePrices[match.symbol] || match.price || 0;
      setSelectedStock({ ...match, price: livePrice });
    }
  }, [requestedSymbol, stocks]);

  // ── Auto-refresh orders every 5s ───────────────────────────
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await getOrders();
        setOrders(Array.isArray(res.data) ? res.data : []);
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // ── WebSocket live prices ───────────────────────────────────
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    setConnected(socket.connected);

    const handler = (prices) => {
      setPrevPrices(prev => ({ ...prev, ...livePrices }));
      setLivePrices(prev => ({ ...prev, ...prices }));
    };
    socket.on('price_update', handler);

    // Order fill notifications
    const orderFillHandler = () => {
      fetchAll();
      refreshUser?.();
    };
    socket.on('order_executed', orderFillHandler);
    socket.on('order_filled', orderFillHandler);

    return () => {
      socket.off('price_update', handler);
      socket.off('order_executed', orderFillHandler);
      socket.off('order_filled', orderFillHandler);
    };
  }, []);

  const handleOrderPlaced = useCallback(async () => {
    await fetchAll();
    refreshUser?.();
  }, [fetchAll, refreshUser]);

  const handleCancelOrder = useCallback(async (orderId) => {
    try {
      await cancelOrder(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'CANCELLED' } : o));
      refreshUser?.();
    } catch (e) {
      console.error('Cancel failed:', e);
    }
  }, [refreshUser]);

  const currentPrice = selectedStock
    ? (livePrices[selectedStock.symbol] || selectedStock.price || 0)
    : 0;

  const prevPrice = selectedStock
    ? (prevPrices[selectedStock.symbol] || currentPrice)
    : 0;

  const priceChange = currentPrice - prevPrice;
  const priceChangeDir = priceChange >= 0 ? 'up' : 'down';

  // ── Portfolio stats from dashboard ──────────────────────────
  const portfolio = dashStats?.portfolio || {};
  const totalPnl = portfolio.totalPnl || 0;
  const totalInvested = portfolio.totalInvested || 0;
  const currentValue = portfolio.currentValue || 0;
  const pnlPercent = portfolio.totalPnlPercent || 0;
  const balance = dashStats?.user?.balance ?? user?.balance ?? 0;
  const netWorth = dashStats?.netWorth || (balance + currentValue);

  const pending = orders.filter(o => o.status === 'PENDING');
  const completed = orders.filter(o => o.status === 'COMPLETED');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-3">

      {/* ── Top Stats Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3">
        <StatCard
          label="Net Worth"
          value={`₹${netWorth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`Balance: ₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={<Activity className="w-4 h-4" />}
          color="purple"
        />
        <StatCard
          label="Invested"
          value={`₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`${portfolio.holdingsCount || holdings.length} holdings`}
          icon={<TrendingUp className="w-4 h-4" />}
          color="blue"
        />
        <StatCard
          label="Current Value"
          value={`₹${currentValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          sub={`P&L: ${totalPnl >= 0 ? '+' : ''}₹${totalPnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          icon={totalPnl >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          color={totalPnl >= 0 ? "green" : "red"}
          pnl={totalPnl}
        />
        <StatCard
          label="P&L %"
          value={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
          sub={pnlPercent >= 0 ? 'In profit' : 'In loss'}
          icon={pnlPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          color={pnlPercent >= 0 ? "green" : "red"}
          pnl={pnlPercent}
        />
        <StatCard
          label="Active Orders"
          value={pending.length}
          sub={`${completed.length} completed`}
          icon={<Activity className="w-4 h-4" />}
          color="yellow"
        />
        <div className="bg-card border border-edge rounded-xl px-4 py-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Market</span>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-profit' : 'text-loss'}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? 'Live' : 'Offline'}
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-sm font-bold font-mono transition-colors ${priceChangeDir === 'up' ? 'text-profit' : 'text-loss'}`}>
              ₹{currentPrice.toFixed(2)}
            </div>
            <div className={`text-[10px] ${priceChangeDir === 'up' ? 'text-profit' : 'text-loss'}`}>
              {selectedStock?.symbol} {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}
            </div>
          </div>
          <button
            onClick={fetchAll}
            className="mt-2 flex items-center gap-1 text-[10px] text-muted hover:text-secondary transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Main Grid: Order Book | Chart | Buy/Sell ── */}
      <div className="grid grid-cols-12 gap-3" style={{ height: 'clamp(440px, 54vh, 580px)' }}>
        {/* Order Book */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-2 min-w-0">
          <OrderBook
            selectedStock={selectedStock}
            livePrices={livePrices}
            orders={orders}
          />
        </div>

        {/* Chart Panel */}
        <div className="col-span-12 lg:col-span-6 xl:col-span-7 min-w-0">
          <ChartPanel
            selectedStock={selectedStock}
            stocks={stocks}
            onStockChange={setSelectedStock}
            currentPrice={currentPrice}
            livePrices={livePrices}
          />
        </div>

        {/* Buy/Sell Panel */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-3 min-w-0">
          <BuySellPanel
            selectedStock={selectedStock}
            currentPrice={currentPrice}
            onOrderPlaced={handleOrderPlaced}
            userBalance={balance}
          />
        </div>
      </div>

      {/* ── Bottom Grid: Portfolio | Orders | AI Card ── */}
      <div className="grid grid-cols-12 gap-3" style={{ minHeight: 'clamp(260px, 28vh, 340px)' }}>
        {/* Portfolio / Holdings */}
        <div className="col-span-12 md:col-span-3 xl:col-span-2 min-w-0">
          <PortfolioSummary
            holdings={holdings}
            livePrices={livePrices}
          />
        </div>

        {/* Active Orders Table */}
        <div className="col-span-12 md:col-span-5 xl:col-span-7 min-w-0">
          <ActiveOrders
            orders={orders}
            onCancel={handleCancelOrder}
          />
        </div>

        {/* AI Prediction Card */}
        <div className="col-span-12 md:col-span-4 xl:col-span-3 min-w-0">
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

// ── Stat Card component ──────────────────────────────────────
function StatCard({ label, value, sub, icon, color, pnl }) {
  const colorMap = {
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-profit bg-profit/10',
    red: 'text-loss bg-loss/10',
    yellow: 'text-warning bg-warning/10',
  };
  const realColor = (pnl !== undefined && pnl < 0) ? 'red' : (pnl !== undefined && pnl >= 0 && (color === 'green' || color === 'red')) ? 'green' : color;
  return (
    <div className="bg-card border border-edge rounded-xl px-4 py-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className={`p-1.5 rounded-lg ${colorMap[realColor] || colorMap.purple}`}>{icon}</span>
      </div>
      <div className={`text-base font-bold font-mono ${(pnl !== undefined) ? (pnl >= 0 ? 'text-profit' : 'text-loss') : 'text-primary'}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted">{sub}</div>
    </div>
  );
}
