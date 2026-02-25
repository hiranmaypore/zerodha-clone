import { useState, useEffect, useRef, useCallback } from 'react';
import { getPriceHistory } from '../../services/api';
import {
  Plus, Camera, Clipboard, Landmark, Crosshair, Search as SearchIcon,
  Pencil, Type, Ruler, Trash2, Maximize2, ChevronDown
} from 'lucide-react';

const timeframes = ['1m', '5m', '15m', '30m', '45m', '1h', '1d', '1y', 'All'];
const toolIcons = [Plus, Camera, Clipboard, Landmark, Crosshair, SearchIcon, Pencil, Type, Ruler, Trash2, Maximize2];

// Generate fallback candlestick data
function generateCandleData(basePrice = 1000, count = 60) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const open = price + (Math.random() - 0.48) * (basePrice * 0.01);
    const close = open + (Math.random() - 0.45) * (basePrice * 0.015);
    const high = Math.max(open, close) + Math.random() * (basePrice * 0.005);
    const low = Math.min(open, close) - Math.random() * (basePrice * 0.005);
    const volume = Math.floor(Math.random() * 500 + 100);
    data.push({ time: now - (count - i) * 60000, open: +open.toFixed(2), close: +close.toFixed(2), high: +high.toFixed(2), low: +low.toFixed(2), volume });
    price = close;
  }
  return data;
}

export default function ChartPanel({ selectedStock, stocks = [], onStockChange, currentPrice, livePrices = {} }) {
  const [activeTab, setActiveTab] = useState('candle');
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [candles, setCandles] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [resizeCount, setResizeCount] = useState(0);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Fetch price history when stock or timeframe changes
  useEffect(() => {
    if (!selectedStock) return;

    const fetchHistory = async () => {
      try {
        const res = await getPriceHistory(selectedStock.symbol, activeTimeframe);
        const data = res.data?.data || [];
        if (data.length > 5) {
          setCandles(data.map(d => ({
            time: new Date(d.timestamp).getTime(),
            open: d.open || d.price,
            high: d.high || d.price * 1.002,
            low: d.low || d.price * 0.998,
            close: d.close || d.price,
            volume: Math.floor(Math.random() * 500 + 100),
          })));
        } else {
          setCandles(generateCandleData(currentPrice || selectedStock.price || 1000));
        }
      } catch {
        setCandles(generateCandleData(currentPrice || selectedStock.price || 1000));
      }
    };
    fetchHistory();
  }, [selectedStock?.symbol, activeTimeframe]);

  // ── Live tick: update the last candle on every price change ──────────
  useEffect(() => {
    if (!currentPrice || candles.length === 0) return;
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = { ...updated[updated.length - 1] };
      last.close = currentPrice;
      last.high  = Math.max(last.high, currentPrice);
      last.low   = Math.min(last.low,  currentPrice);
      last.volume += Math.floor(Math.random() * 30 + 5);
      updated[updated.length - 1] = last;
      return updated;
    });
  }, [currentPrice]);

  // ── New candle every 30 s (seals old one, opens a fresh one) ─────────
  useEffect(() => {
    if (candles.length === 0) return;
    const interval = setInterval(() => {
      setCandles(prev => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        const openPrice = last.close;
        const newCandle = {
          time:   Date.now(),
          open:   openPrice,
          close:  openPrice,
          high:   openPrice,
          low:    openPrice,
          volume: Math.floor(Math.random() * 200 + 50),
        };
        // Keep at most 80 candles so the chart doesn't grow forever
        const trimmed = prev.length >= 80 ? prev.slice(1) : prev;
        return [...trimmed, newCandle];
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, [candles.length > 0]); // only restart if candles go from empty → populated

  // Resize observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setResizeCount(c => c + 1));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Draw candlestick chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    const maxPrice = Math.max(...candles.map(c => c.high)) * 1.005;
    const minPrice = Math.min(...candles.map(c => c.low)) * 0.995;
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = Math.max(2, (chartW / candles.length) * 0.65);
    const gap = chartW / candles.length;

    const toY = (price) => padding.top + chartH * (1 - (price - minPrice) / priceRange);
    const toX = (i) => padding.left + gap * i + gap / 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(48, 54, 61, 0.4)';
    ctx.lineWidth = 0.5;
    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      const price = maxPrice - (priceRange / gridLines) * i;
      ctx.fillStyle = '#6E7681';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), w - padding.right + 6, y + 3);
    }

    // Volume bars
    const maxVol = Math.max(...candles.map(c => c.volume)) || 1;
    const volH = chartH * 0.15;
    candles.forEach((c, i) => {
      const x = toX(i);
      const barH = (c.volume / maxVol) * volH;
      const isBull = c.close >= c.open;
      ctx.fillStyle = isBull ? 'rgba(38, 166, 65, 0.25)' : 'rgba(248, 81, 73, 0.25)';
      ctx.fillRect(x - candleWidth / 2, padding.top + chartH - barH, candleWidth, barH);
    });

    // Candles
    candles.forEach((c, i) => {
      const x = toX(i);
      const isBull = c.close >= c.open;
      const color = isBull ? '#26A641' : '#F85149';

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(bodyBot - bodyTop, 1);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyH);
    });

    // Current price line + tag
    const lastCandle = candles[candles.length - 1];
    const lastPrice = currentPrice || lastCandle.close;
    const lastY = toY(lastPrice);
    const isBull = lastPrice >= lastCandle.open;

    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = isBull ? 'rgba(38, 166, 65, 0.5)' : 'rgba(248, 81, 73, 0.5)';
    ctx.beginPath();
    ctx.moveTo(padding.left, lastY);
    ctx.lineTo(w - padding.right, lastY);
    ctx.stroke();
    ctx.setLineDash([]);

    const tagColor = isBull ? '#26A641' : '#F85149';
    const tagW = 62;
    const tagH = 20;
    const tagX = w - padding.right - 2;
    ctx.fillStyle = tagColor;
    roundRect(ctx, tagX, lastY - tagH / 2, tagW, tagH, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(lastPrice.toFixed(2), tagX + tagW / 2, lastY + 4);

    // High marker
    const highCandle = candles.reduce((a, b) => a.high > b.high ? a : b);
    const highIdx = candles.indexOf(highCandle);
    const highX = toX(highIdx);
    const highY = toY(highCandle.high);
    ctx.fillStyle = '#26A641';
    roundRect(ctx, highX - 22, highY - 22, 55, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('₹' + highCandle.high.toFixed(2), highX + 5, highY - 10);

  }, [candles, resizeCount]);

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const symbol = selectedStock?.symbol || 'RELIANCE';
  const stockName = selectedStock?.name || 'Reliance Industries';

  return (
    <div className="bg-card border border-edge rounded-2xl flex flex-col h-full overflow-hidden">
      {/* Pair Info Header */}
      <div className="px-4 py-3 border-b border-edge flex items-center gap-4 flex-wrap">
        {/* Stock Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setSearchQuery(''); }}
            className="flex items-center gap-2 hover:bg-surface px-2 py-1 rounded-lg transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
              {symbol.charAt(0)}
            </div>
            <div>
              <span className="text-sm font-bold text-primary">{symbol}</span>
              <span className="ml-1 text-[10px] text-muted hidden sm:inline">{stockName}</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1 left-0 w-60 bg-card border border-edge rounded-xl shadow-2xl animate-fade-in flex flex-col overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-edge">
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search stocks…"
                  className="w-full bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-xs text-primary placeholder-muted focus:border-accent outline-none"
                />
              </div>
              <div className="overflow-y-auto max-h-56">
                {stocks
                  .filter(s =>
                    !searchQuery ||
                    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(s => {
                    const livePrice = livePrices[s.symbol] || s.price || 0;
                    return (
                      <button
                        key={s.symbol}
                        onClick={() => {
                          onStockChange({ ...s, price: livePrice });
                          setDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-hover flex items-center gap-2 transition-colors ${
                          s.symbol === symbol ? 'bg-surface' : ''
                        }`}
                      >
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[8px] font-bold shrink-0">
                          {s.symbol.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-primary">{s.symbol}</div>
                          <div className="text-muted text-[9px] truncate">{s.name}</div>
                        </div>
                        <span className={`ml-auto font-mono text-[10px] font-bold shrink-0 ${
                          s.symbol === symbol ? 'text-accent' : 'text-secondary'
                        }`}>
                          ₹{livePrice.toFixed(2)}
                        </span>
                      </button>
                    );
                  })
                }
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-4 text-[10px]">
          <StatBadge label="Price" value={`₹${currentPrice?.toFixed(2) || '—'}`} color="text-primary" />
          <StatBadge label="24h High" value={`₹${(currentPrice * 1.03)?.toFixed(2) || '—'}`} color="text-profit" />
          <StatBadge label="24h Low" value={`₹${(currentPrice * 0.97)?.toFixed(2) || '—'}`} color="text-loss" />
        </div>
      </div>

      {/* Chart Type Tabs + Tools */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-edge">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('candle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${activeTab === 'candle' ? 'bg-surface text-primary' : 'text-muted hover:text-secondary'}`}
          >
            Candle
          </button>
          <button
            onClick={() => setActiveTab('depth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${activeTab === 'depth' ? 'bg-surface text-primary' : 'text-muted hover:text-secondary'}`}
          >
            Depth
          </button>
        </div>
        <div className="hidden md:flex items-center gap-0.5">
          {toolIcons.map((Icon, i) => (
            <button key={i} className="p-1.5 text-muted hover:text-secondary transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="flex-1 relative min-h-0" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
      </div>

      {/* Timeframe Selector */}
      <div className="px-4 py-2 border-t border-edge flex items-center gap-1 overflow-x-auto">
        {timeframes.map((tf, i) => (
          <button
            key={`${tf}-${i}`}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap
              ${activeTimeframe === tf ? 'bg-purple-600 text-white' : 'text-muted hover:text-secondary hover:bg-surface'}`}
          >
            {tf}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatBadge({ label, value, color }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted text-[9px]">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
