import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Search, Bell, ChevronDown, LogOut, Settings, X,
  CheckCircle, XCircle, TrendingUp, TrendingDown,
  AlertTriangle, Zap, Trash2, CheckCheck, ShieldAlert, Clock,
  LayoutDashboard, LineChart, ListChecks, Briefcase, Bookmark,
  Trophy, Calendar, FlaskRound, Activity, Coins
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useNotifications } from "../hooks/useNotifications";
import { StockIcon } from "./StockIcon";
import ThemeToggle from "./ThemeToggle";

// All available stocks for search
const ALL_STOCKS = [
  { symbol: 'TCS',        name: 'Tata Consultancy Services' },
  { symbol: 'INFY',       name: 'Infosys' },
  { symbol: 'RELIANCE',   name: 'Reliance Industries' },
  { symbol: 'HDFC',       name: 'HDFC Bank' },
  { symbol: 'ICICI',      name: 'ICICI Bank' },
  { symbol: 'SBIN',       name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel' },
  { symbol: 'HCLTECH',    name: 'HCL Technologies' },
  { symbol: 'ITC',        name: 'ITC Limited' },
  { symbol: 'KOTAKBANK',  name: 'Kotak Mahindra Bank' },
  { symbol: 'LT',         name: 'Larsen & Toubro' },
  { symbol: 'AXISBANK',   name: 'Axis Bank' },
  { symbol: 'WIPRO',      name: 'Wipro' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance' },
  { symbol: 'MARUTI',     name: 'Maruti Suzuki' },
  { symbol: 'TITAN',      name: 'Titan Company' },
  { symbol: 'SUNPHARMA',  name: 'Sun Pharmaceutical' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints' },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement' },
];

const navItems = [
  { path: "/dashboard",  label: "Live",       icon: LayoutDashboard },
  { path: "/market",     label: "Market",     icon: LineChart },
  { path: "/orders",     label: "Orders",     icon: ListChecks },
  { path: "/holdings",   label: "Portfolio",  icon: Briefcase },
  { path: "/leaderboard",label: "Hall of Fame",icon: Trophy },
  { path: "/journal",    label: "Journal",    icon: Calendar },
  { path: "/bids",       label: "Bids",       icon: Coins },
  { path: "/algolab",    label: "Algo Lab",   icon: FlaskRound },
  { path: "/pulse",      label: "Pulse",      icon: Activity },
  { path: "/watchlist",  label: "Watchlist",  icon: Bookmark },
  { path: "/funds",      label: "Funds",      icon: null },
  { path: "/calculators",label: "Calculators",icon: null },
];

// Config per notification type
const NOTIF_CFG = {
  order_executed: {
    icon: (d) => d.type === 'BUY'
      ? <TrendingUp   className="w-4 h-4 text-profit" />
      : <TrendingDown className="w-4 h-4 text-loss" />,
    title: (d) => `${d.type} Order Filled`,
    body:  (d) => `${d.quantity} × ${d.stock} @ ₹${d.price?.toFixed(2)}`,
    dot: 'bg-profit',
  },
  order_cancelled: {
    icon: () => <XCircle className="w-4 h-4 text-loss" />,
    title: () => 'Order Cancelled',
    body:  (d) => `${d.stock} order was cancelled`,
    dot: 'bg-loss',
  },
  stop_loss_triggered: {
    icon: () => <AlertTriangle className="w-4 h-4 text-warning" />,
    title: () => 'Stop Loss Triggered',
    body:  (d) => `${d.stock} hit SL @ ₹${d.price?.toFixed(2)}`,
    dot: 'bg-warning',
  },
  bracket_entry: {
    icon: () => <Zap className="w-4 h-4 text-accent" />,
    title: () => 'Bracket Order Entry',
    body:  (d) => `${d.stock} bracket triggered @ ₹${d.price?.toFixed(2)}`,
    dot: 'bg-accent',
  },
  mis_warning: {
    icon: () => <Clock className="w-4 h-4 text-warning" />,
    title: () => '⚠️ MIS Square-Off Warning',
    body:  (d) => d.message || 'MIS positions will be squared off in 5 minutes',
    dot: 'bg-warning',
  },
  mis_squaredoff: {
    icon: () => <ShieldAlert className="w-4 h-4 text-loss" />,
    title: () => 'MIS Position Closed',
    body:  (d) => d.message || `${d.stock} squared off at ₹${d.price?.toFixed(2)}`,
    dot: 'bg-loss',
  },
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)  return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  return `${Math.floor(secs/3600)}h ago`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userOpen,   setUserOpen]   = useState(false);
  const [bellOpen,   setBellOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ,    setSearchQ]    = useState('');
  const [searchIdx,  setSearchIdx]  = useState(0);

  const userRef   = useRef(null);
  const bellRef   = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const { notifications, unreadCount, markAllRead, markRead, clear } =
    useNotifications(user?._id || user?.id);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userRef.current   && !userRef.current.contains(e.target))   setUserOpen(false);
      if (bellRef.current   && !bellRef.current.contains(e.target))   setBellOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cmd/Ctrl+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setSearchQ('');
        setSearchIdx(0);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const searchResults = searchQ.trim()
    ? ALL_STOCKS.filter(s =>
        s.symbol.toLowerCase().includes(searchQ.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQ.toLowerCase())
      ).slice(0, 8)
    : ALL_STOCKS.slice(0, 8);

  const goToStock = (symbol) => {
    navigate(`/dashboard?stock=${symbol}`);
    setSearchOpen(false);
    setSearchQ('');
  };

  const handleSearchKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIdx(i => Math.min(i + 1, searchResults.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSearchIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && searchResults[searchIdx]) goToStock(searchResults[searchIdx].symbol);
    if (e.key === 'Escape') setSearchOpen(false);
  };

  // Auto-show bell when a brand-new notification arrives
  const prevNotifLenRef = useRef(0);
  useEffect(() => {
    const len = notifications.length;
    if (len > prevNotifLenRef.current) {
      // Defer to avoid "synchronous setState in effect" lint rule
      const t = setTimeout(() => setBellOpen(true), 0);
      prevNotifLenRef.current = len;
      return () => clearTimeout(t);
    }
    prevNotifLenRef.current = len;
  }, [notifications.length]);



  const handleLogout = () => { logout(); navigate("/"); };

  const openBell = () => {
    setBellOpen(o => !o);
    setUserOpen(false);
  };

  const openUser = () => {
    setUserOpen(o => !o);
    setBellOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-card/90 backdrop-blur-xl border-b border-edge z-50">
      <div className="h-full max-w-[1920px] mx-auto px-4 flex items-center justify-between">

        {/* ── Logo + Nav ── */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-2 cursor-pointer shrink-0"
            onClick={() => navigate("/dashboard")}
          >
            <div className="relative w-8 h-8">
              <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
                <path d="M8 20C8 14 12 8 20 8"    stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <path d="M14 20C14 16 16 12 20 12" stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                <path d="M20 8C28 8 32 14 32 20"   stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <path d="M20 12C24 12 26 16 26 20"  stroke="#A78BFA" strokeWidth="3" strokeLinecap="round" />
                <path d="M32 20C32 26 28 32 20 32"  stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
                <circle cx="20" cy="20" r="2" fill="#A78BFA" />
              </svg>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ path, label }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-surface text-primary"
                      : "text-secondary hover:text-primary hover:bg-surface/60"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* ── Right Side ── */}
        <div className="flex items-center gap-1">

          {/* Search button */}
          <button
            onClick={() => { setSearchOpen(true); setSearchQ(''); setSearchIdx(0); setTimeout(() => searchInputRef.current?.focus(), 50); }}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all flex items-center gap-1.5"
            title="Search stocks (Ctrl+K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden lg:inline text-xs text-muted">⌘K</span>
          </button>

          {/* ── Global Search Modal ── */}
          {searchOpen && (
            <div className="fixed inset-0 bg-black/60 z-100 flex items-start justify-center pt-20 px-4" onClick={() => setSearchOpen(false)}>
              <div ref={searchRef} className="w-full max-w-md bg-card border border-edge rounded-2xl shadow-2xl overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-edge">
                  <Search className="w-4 h-4 text-muted shrink-0" />
                  <input
                    ref={searchInputRef}
                    value={searchQ}
                    onChange={e => { setSearchQ(e.target.value); setSearchIdx(0); }}
                    onKeyDown={handleSearchKey}
                    placeholder="Search stocks by name or symbol…"
                    className="flex-1 bg-transparent text-sm text-primary placeholder-muted outline-none"
                  />
                  {searchQ && (
                    <button onClick={() => setSearchQ('')} className="text-muted hover:text-primary">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <kbd className="hidden sm:inline text-[10px] text-muted bg-surface border border-edge rounded px-1.5 py-0.5">ESC</kbd>
                </div>
                {/* Results */}
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    searchResults.map((s, i) => (
                      <button
                        key={s.symbol}
                        onClick={() => goToStock(s.symbol)}
                        onMouseEnter={() => setSearchIdx(i)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                          i === searchIdx ? 'bg-surface' : 'hover:bg-surface/60'
                        }`}
                      >
                        <StockIcon symbol={s.symbol} className="w-8 h-8" textSize="text-xs" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-primary">{s.symbol}</div>
                          <div className="text-xs text-muted truncate">{s.name}</div>
                        </div>
                        <span className="ml-auto text-[10px] text-muted">View chart →</span>
                      </button>
                    ))
                  ) : (
                    <div className="py-8 text-center text-sm text-muted">No stocks found</div>
                  )}
                </div>
                <div className="px-4 py-2 border-t border-edge flex items-center gap-3 text-[10px] text-muted">
                  <span>↑↓ navigate</span><span>↵ select</span><span>ESC close</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Bell / Notifications ── */}
          <div className="relative" ref={bellRef}>
            <button
              onClick={openBell}
              className={`p-2 rounded-xl transition-all relative ${
                bellOpen
                  ? 'text-primary bg-surface'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-edge rounded-xl shadow-2xl animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-edge flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-muted" />
                    <span className="text-sm font-semibold text-primary">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 bg-accent text-white text-[9px] font-bold rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        title="Mark all read"
                        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={clear}
                        title="Clear all"
                        className="p-1.5 rounded-lg text-muted hover:text-loss hover:bg-loss/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                      <Bell className="w-8 h-8 mx-auto text-muted/20" />
                      <p className="text-xs text-muted">No notifications yet</p>
                      <p className="text-[10px] text-muted/60">Order events will appear here</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-edge">
                      {notifications.map(n => {
                        const cfg = NOTIF_CFG[n.type];
                        if (!cfg) return null;
                        return (
                          <div
                            key={n.id}
                            onClick={() => markRead(n.id)}
                            className={`px-4 py-3 flex items-start gap-3 cursor-default transition-colors hover:bg-surface/60
                              ${!n.read ? 'bg-surface/30' : ''}`}
                          >
                            {/* Icon */}
                            <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shrink-0 mt-0.5">
                              {cfg.icon(n.data)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-semibold text-primary">{cfg.title(n.data)}</p>
                                {!n.read && (
                                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                                )}
                              </div>
                              <p className="text-[11px] text-muted mt-0.5">{cfg.body(n.data)}</p>
                              <p className="text-[10px] text-muted/50 mt-1">{timeAgo(n.time)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-edge">
                    <button
                      onClick={() => { navigate('/orders'); setBellOpen(false); }}
                      className="text-xs text-accent hover:text-accent/80 transition-colors"
                    >
                      View all orders →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <ThemeToggle />

          {/* Settings → Profile */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-surface transition-all"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-edge mx-2" />

          {/* ── User Dropdown ── */}
          <div className="relative" ref={userRef}>
            <button
              onClick={openUser}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-surface transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-primary hidden lg:block max-w-[120px] truncate">
                {user?.name || "User"}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-muted transition-transform ${userOpen ? "rotate-180" : ""}`}
              />
            </button>

            {userOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-edge rounded-xl shadow-2xl py-2 animate-fade-in">
                <div className="px-4 py-2.5 border-b border-edge">
                  <p className="text-sm font-semibold text-primary truncate">{user?.name}</p>
                  <p className="text-[11px] text-muted truncate mt-0.5">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-loss hover:bg-loss/10 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-edge z-50 flex items-center justify-around px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          if (!Icon) return null;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 w-full h-full text-[10px] font-medium transition-colors ${
                  isActive ? "text-accent" : "text-muted hover:text-secondary"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <ThemeToggle />
          <span className="text-[10px] font-medium text-muted">Theme</span>
        </div>
      </nav>
    </header>
  );
}
