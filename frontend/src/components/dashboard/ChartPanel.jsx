import { useState, useEffect, useRef, useCallback } from 'react';
import { getPriceHistory } from '../../services/api';
import { useWatchlist } from '../../hooks/useWatchlist';
import { StockIcon } from '../StockIcon';
import {
  ZoomIn, ZoomOut, RotateCcw, Expand, Shrink, ChevronDown, MoveHorizontal, Star
} from 'lucide-react';


const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W'];

const MIN_VISIBLE = 10;   // most zoomed-in  (10 candles)
const MAX_VISIBLE = 120;  // most zoomed-out (120 candles)
const DEFAULT_VISIBLE = 60;

const CHART_CACHE = {};
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

// ── Generate fallback candle data ─────────────────────────────────────────
function generateCandleData(basePrice = 1000, count = 120) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const open  = price + (Math.random() - 0.48) * (basePrice * 0.008);
    const close = open  + (Math.random() - 0.45) * (basePrice * 0.012);
    const high  = Math.max(open, close) + Math.random() * (basePrice * 0.004);
    const low   = Math.min(open, close) - Math.random() * (basePrice * 0.004);
    data.push({
      time: now - (count - i) * 60_000,
      open:  +open.toFixed(2),
      close: +close.toFixed(2),
      high:  +high.toFixed(2),
      low:   +low.toFixed(2),
      volume: Math.floor(Math.random() * 500 + 100),
    });
    price = close;
  }
  return data;
}

// ── Round-rect helper ─────────────────────────────────────────────────────
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

export default function ChartPanel({ selectedStock, stocks = [], onStockChange, currentPrice, livePrices = {} }) {
  const [activeTimeframe, setActiveTimeframe] = useState('1h');
  const [candles, setCandles]           = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [crosshair, setCrosshair]       = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [cursor, setCursor]             = useState('default');

  const { isWatched, toggle: toggleWatch } = useWatchlist();

  // ── Track cache key to use in setCandles inside intervals ─────────────
  const cacheKeyRef = useRef(`${selectedStock?.symbol}_${activeTimeframe}`);
  useEffect(() => {
    if (selectedStock?.symbol) {
      cacheKeyRef.current = `${selectedStock.symbol}_${activeTimeframe}`;
    }
  }, [selectedStock?.symbol, activeTimeframe]);

  // ── Zoom / pan state (held in refs so draw never re-registers events) ──
  const visibleCountRef = useRef(DEFAULT_VISIBLE); // how many candles fit
  const panOffsetRef    = useRef(0);               // candles from the right end

  // Force a redraw after zoom/pan state changes
  const [drawTick, setDrawTick] = useState(0);
  const redraw = useCallback(() => setDrawTick(t => t + 1), []);

  const canvasRef      = useRef(null);
  const containerRef   = useRef(null);   // outer card — fullscreen target
  const chartAreaRef   = useRef(null);   // canvas wrapper only
  const dropdownRef    = useRef(null);
  const dragRef        = useRef({ active: false, startX: 0, startOffset: 0 });

  // ── Fullscreen state ─────────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const el = chartAreaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(err => console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Chart redraws automatically because ResizeObserver fires on fullscreen resize
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);


  // ── Close dropdown on outside click ──────────────────────────────────
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false); setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // ── Fetch history when stock / timeframe changes ──────────────────────
  useEffect(() => {
    if (!selectedStock) return;

    const cacheKey = `${selectedStock.symbol}_${activeTimeframe}`;
    const now = Date.now();
    
    // Use cached data if valid (< 3 hours old)
    if (CHART_CACHE[cacheKey] && (now - CHART_CACHE[cacheKey].timestamp < CACHE_DURATION)) {
      setCandles(CHART_CACHE[cacheKey].data);
      return;
    }

    const fetch = async () => {
      try {
        const res = await getPriceHistory(selectedStock.symbol, activeTimeframe);
        const data = res.data?.data || [];
        if (data.length > 5) {
          const freshData = data.map(d => ({
            time:   new Date(d.timestamp).getTime(),
            open:   d.open  || d.price,
            high:   d.high  || d.price * 1.002,
            low:    d.low   || d.price * 0.998,
            close:  d.close || d.price,
            volume: Math.floor(Math.random() * 500 + 100),
          }));
          CHART_CACHE[cacheKey] = { timestamp: now, data: freshData };
          setCandles(freshData);
        } else {
          const fallbackData = generateCandleData(currentPrice || selectedStock.price || 1000);
          CHART_CACHE[cacheKey] = { timestamp: now, data: fallbackData };
          setCandles(fallbackData);
        }
      } catch {
        const fallbackData = generateCandleData(currentPrice || selectedStock.price || 1000);
        CHART_CACHE[cacheKey] = { timestamp: now, data: fallbackData };
        setCandles(fallbackData);
      }
    };
    fetch();
  }, [selectedStock?.symbol, activeTimeframe]);

  // ── Live tick: update last candle on every price change ──────────────
  useEffect(() => {
    if (!currentPrice || candles.length === 0) return;
    setCandles(prev => {
      if (!prev.length) return prev;
      const copy = [...prev];
      const last = { ...copy[copy.length - 1] };
      last.close  = currentPrice;
      last.high   = Math.max(last.high, currentPrice);
      last.low    = Math.min(last.low,  currentPrice);
      last.volume += Math.floor(Math.random() * 20 + 3);
      copy[copy.length - 1] = last;
      
      // Keep cache up to date
      if (cacheKeyRef.current && CHART_CACHE[cacheKeyRef.current]) {
        CHART_CACHE[cacheKeyRef.current].data = copy;
      }
      return copy;
    });
  }, [currentPrice]);

  // ── New candle every 30 s ─────────────────────────────────────────────
  useEffect(() => {
    if (candles.length === 0) return;
    const id = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev;
        const openPrice = prev[prev.length - 1].close;
        const newC = { time: Date.now(), open: openPrice, close: openPrice, high: openPrice, low: openPrice, volume: 80 };
        const trimmed = prev.length >= 200 ? prev.slice(1) : prev;
        const copy = [...trimmed, newC];
        
        // Keep cache up to date
        if (cacheKeyRef.current && CHART_CACHE[cacheKeyRef.current]) {
          CHART_CACHE[cacheKeyRef.current].data = copy;
        }
        return copy;
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [candles.length > 0]);

  // ── Resize observer ───────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(redraw);
    ro.observe(el);
    return () => ro.disconnect();
  }, [redraw]);

  // ── DRAW ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width  = rect.width  * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const pad = { top: 20, right: 68, bottom: 30, left: 4 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    // Compute viewport slice
    const total    = candles.length;
    const visible  = Math.min(visibleCountRef.current, total);
    const offset   = Math.min(panOffsetRef.current, total - visible);
    const startIdx = Math.max(0, total - visible - offset);
    const endIdx   = Math.max(visible, total - offset);
    const slice    = candles.slice(startIdx, endIdx);
    if (slice.length === 0) return;

    const maxP = Math.max(...slice.map(c => c.high)) * 1.003;
    const minP = Math.min(...slice.map(c => c.low))  * 0.997;
    const priceRange = maxP - minP || 1;

    const gap  = chartW / slice.length;
    const cw   = Math.max(1, gap * 0.7);

    const toY = p  => pad.top + chartH * (1 - (p - minP) / priceRange);
    const toX = i  => pad.left + gap * i + gap / 2;

    // ── Grid ──────────────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(48,54,61,0.35)';
    ctx.lineWidth   = 0.5;
    for (let g = 0; g <= 6; g++) {
      const y = pad.top + (chartH / 6) * g;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const p = maxP - (priceRange / 6) * g;
      ctx.fillStyle  = '#6E7681';
      ctx.font       = '9.5px Inter,sans-serif';
      ctx.textAlign  = 'left';
      ctx.fillText(p.toFixed(2), W - pad.right + 6, y + 3);
    }
    // Vertical time lines every ~10 candles
    const step = Math.max(1, Math.round(slice.length / 8));
    for (let i = 0; i < slice.length; i += step) {
      const x  = toX(i);
      const ts = new Date(slice[i].time);
      const label = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      ctx.strokeStyle = 'rgba(48,54,61,0.25)';
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + chartH); ctx.stroke();
      ctx.fillStyle  = '#6E7681';
      ctx.font       = '8px Inter,sans-serif';
      ctx.textAlign  = 'center';
      ctx.fillText(label, x, H - 6);
    }

    // ── Volume bars ──────────────────────────────────────────────────
    const maxVol = Math.max(...slice.map(c => c.volume)) || 1;
    const volH   = chartH * 0.12;
    slice.forEach((c, i) => {
      const x    = toX(i);
      const barH = (c.volume / maxVol) * volH;
      ctx.fillStyle = c.close >= c.open
        ? 'rgba(38,166,65,0.2)' : 'rgba(248,81,73,0.2)';
      ctx.fillRect(x - cw / 2, pad.top + chartH - barH, cw, barH);
    });

    // ── Candles ───────────────────────────────────────────────────────
    slice.forEach((c, i) => {
      const x    = toX(i);
      const bull = c.close >= c.open;
      const color = bull ? '#26A641' : '#F85149';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH   = Math.max(bodyBot - bodyTop, 1);
      ctx.fillStyle = color;
      ctx.fillRect(x - cw / 2, bodyTop, cw, bodyH);
    });

    // ── Live price dashed line + price tag ───────────────────────────
    const last      = slice[slice.length - 1];
    const liveP     = currentPrice || last.close;
    const livePy    = toY(liveP);
    const priceBull = liveP >= last.open;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = priceBull ? 'rgba(38,166,65,0.6)' : 'rgba(248,81,73,0.6)';
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, livePy); ctx.lineTo(W - pad.right, livePy); ctx.stroke();
    ctx.setLineDash([]);

    const tagColor = priceBull ? '#26A641' : '#F85149';
    ctx.fillStyle  = tagColor;
    roundRect(ctx, W - pad.right, livePy - 10, 66, 20, 3); ctx.fill();
    ctx.fillStyle  = '#fff';
    ctx.font       = 'bold 10px Inter,sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('₹' + liveP.toFixed(2), W - pad.right + 33, livePy + 4);

    // ── Crosshair ─────────────────────────────────────────────────────
    if (crosshair) {
      ctx.strokeStyle = 'rgba(88,166,255,0.5)';
      ctx.lineWidth   = 0.7;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(crosshair.x, pad.top); ctx.lineTo(crosshair.x, pad.top + chartH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, crosshair.y); ctx.lineTo(W - pad.right, crosshair.y); ctx.stroke();
      ctx.setLineDash([]);

      // Price label on right axis
      ctx.fillStyle = 'rgba(88,166,255,0.9)';
      roundRect(ctx, W - pad.right, crosshair.y - 10, 66, 20, 3); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('₹' + crosshair.price.toFixed(2), W - pad.right + 33, crosshair.y + 4);

      // Date label on x axis
      if (crosshair.time) {
        const dtLabel = new Date(crosshair.time).toLocaleString('en-IN', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const lw = Math.min(130, dtLabel.length * 6.5 + 12);
        ctx.fillStyle = 'rgba(88,166,255,0.9)';
        roundRect(ctx, crosshair.x - lw / 2, H - pad.bottom + 2, lw, 16, 3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '9px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(dtLabel, crosshair.x, H - pad.bottom + 13);
      }
    }

    // Store slice info for mouse calculations
    canvas._chartMeta = { pad, chartW, chartH, W, H, gap, slice, minP, priceRange };

  }, [candles, drawTick, crosshair]);

  // ── Mouse: wheel = zoom, drag = pan, move = crosshair ────────────────
  const handleWheel = useCallback(e => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1; // scroll down = zoom out
    const step  = Math.max(1, Math.round(visibleCountRef.current * 0.1));
    visibleCountRef.current = Math.min(MAX_VISIBLE, Math.max(MIN_VISIBLE, visibleCountRef.current + delta * step));
    redraw();
  }, [redraw]);

  const handleMouseDown = useCallback(e => {
    dragRef.current = { active: true, startX: e.clientX, startOffset: panOffsetRef.current };
    setIsDragging(true);
    setCursor('grabbing');
  }, []);

  const handleMouseMove = useCallback(e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const meta = canvas._chartMeta;

    // Update crosshair
    if (meta) {
      const rect  = canvas.getBoundingClientRect();
      const mx    = e.clientX - rect.left;
      const my    = e.clientY - rect.top;
      const { pad, chartH, W, H, gap, slice, minP, priceRange } = meta;

      if (mx >= pad.left && mx <= W - pad.right && my >= pad.top && my <= pad.top + chartH) {
        const price = minP + priceRange * (1 - (my - pad.top) / chartH);
        const ci    = Math.round((mx - pad.left) / gap - 0.5);
        const time  = slice[Math.max(0, Math.min(ci, slice.length - 1))]?.time;
        setCrosshair({ x: mx, y: my, price, time });
      } else {
        setCrosshair(null);
      }
    }

    // Pan
    if (dragRef.current.active) {
      const canvas2 = canvasRef.current;
      if (!canvas2?._chartMeta) return;
      const { gap } = canvas2._chartMeta;
      const dx        = e.clientX - dragRef.current.startX;
      const candleDx  = Math.round(-dx / (gap || 8));
      const newOffset = Math.max(0, dragRef.current.startOffset + candleDx);
      panOffsetRef.current = newOffset;
      redraw();
    }
  }, [redraw]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
    setCursor('default');
  }, []);

  const handleMouseLeave = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
    setCursor('default');
    setCrosshair(null);
  }, []);

  // Attach non-passive wheel listener
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Zoom button handlers ──────────────────────────────────────────────
  const zoomIn    = () => { visibleCountRef.current = Math.max(MIN_VISIBLE, Math.round(visibleCountRef.current * 0.7)); redraw(); };
  const zoomOut   = () => { visibleCountRef.current = Math.min(MAX_VISIBLE, Math.round(visibleCountRef.current * 1.4)); redraw(); };
  const zoomReset = () => { visibleCountRef.current = DEFAULT_VISIBLE; panOffsetRef.current = 0; redraw(); };


  const symbol    = selectedStock?.symbol || 'RELIANCE';
  const stockName = selectedStock?.name   || '';

  return (
    <div className="bg-card border border-edge rounded-xl flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="px-4 py-2.5 border-b border-edge flex items-center gap-4 flex-wrap">
        {/* Stock Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => { setDropdownOpen(o => !o); setSearchQuery(''); }}
            className="flex items-center gap-2 hover:bg-surface px-2 py-1 rounded-lg transition-colors"
          >
            <StockIcon symbol={symbol} className="w-6 h-6" textSize="text-[9px]" />
            <span className="text-sm font-bold text-primary">{symbol}</span>
            <span className="text-[10px] text-muted hidden sm:inline truncate max-w-[120px]">{stockName}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Watchlist star for selected stock */}
          <button
            onClick={e => { e.stopPropagation(); if (selectedStock) toggleWatch(selectedStock.symbol); }}
            title={isWatched(symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
            className="p-1 rounded-lg hover:bg-surface transition-colors"
          >
            <Star
              className={`w-4 h-4 transition-colors ${
                isWatched(symbol)
                  ? 'text-warning fill-warning'
                  : 'text-muted hover:text-warning'
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-50 top-full mt-1 left-0 w-60 bg-card border border-edge rounded-xl shadow-2xl animate-fade-in flex flex-col overflow-hidden">
              <div className="p-2 border-b border-edge">
                <input
                  autoFocus value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search stocks…"
                  className="w-full bg-surface border border-edge rounded-lg px-2.5 py-1.5 text-xs text-primary placeholder-muted focus:border-accent outline-none"
                />
              </div>
              <div className="overflow-y-auto max-h-56">
                {stocks
                  .filter(s => !searchQuery || s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(s => {
                    const livePrice = livePrices[s.symbol] || s.price || 0;
                    return (
                      <div
                        key={s.symbol}
                        onClick={() => { onStockChange({ ...s, price: livePrice }); setDropdownOpen(false); setSearchQuery(''); }}
                        className={`w-full px-3 py-2 text-left text-xs cursor-pointer hover:bg-hover flex items-center gap-2 transition-colors ${s.symbol === symbol ? 'bg-surface' : ''}`}
                      >
                        <StockIcon symbol={s.symbol} className="w-5 h-5" textSize="text-[8px]" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-primary">{s.symbol}</div>
                          <div className="text-muted text-[9px] truncate">{s.name}</div>
                        </div>
                        <span className={`font-mono text-[10px] font-bold shrink-0 ${s.symbol === symbol ? 'text-accent' : 'text-secondary'}`}>
                          ₹{livePrice.toFixed(2)}
                        </span>
                        {/* Watchlist star per row */}
                        <button
                          onClick={e => { e.stopPropagation(); toggleWatch(s.symbol); }}
                          className="ml-1 p-0.5 rounded hover:bg-surface transition-colors shrink-0"
                          title={isWatched(s.symbol) ? 'Remove from watchlist' : 'Add to watchlist'}
                        >
                          <Star className={`w-3 h-3 transition-colors ${
                            isWatched(s.symbol) ? 'text-warning fill-warning' : 'text-muted/40 hover:text-warning'
                          }`} />
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Live price stats */}
        <div className="hidden lg:flex items-center gap-4 text-[10px]">
          <StatBadge label="LTP"     value={`₹${currentPrice?.toFixed(2) || '—'}`}              color="text-primary" />
          <StatBadge label="24h High" value={`₹${(currentPrice * 1.03)?.toFixed(2) || '—'}`}   color="text-profit"  />
          <StatBadge label="24h Low"  value={`₹${(currentPrice * 0.97)?.toFixed(2) || '—'}`}   color="text-loss"    />
        </div>

          {/* Zoom + Fullscreen controls — right side */}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={zoomIn}    title="Zoom In (scroll up)"    className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface transition-colors">
              <ZoomIn  className="w-3.5 h-3.5" />
            </button>
            <button onClick={zoomOut}   title="Zoom Out (scroll down)" className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface transition-colors">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button onClick={zoomReset} title="Reset zoom &amp; pan"   className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-edge mx-0.5" />
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen chart'}
              className={`p-1.5 rounded transition-colors ${
                isFullscreen
                  ? 'text-accent bg-accent/10 hover:bg-accent/20'
                  : 'text-muted hover:text-primary hover:bg-surface'
              }`}
            >
              {isFullscreen ? <Shrink className="w-3.5 h-3.5" /> : <Expand className="w-3.5 h-3.5" />}
            </button>
            <div className="w-px h-4 bg-edge mx-0.5" />
            <div className="text-[9px] text-muted hidden sm:flex items-center gap-1">
              <MoveHorizontal className="w-3 h-3" /> drag
            </div>
          </div>       {/* end zoom controls */}
        </div>         {/* end header px-4 row */}

      {/* ── Timeframes ── */}
      <div className="px-3 py-1.5 border-b border-edge flex items-center gap-1 overflow-x-auto">
        {timeframes.map(tf => (
          <button
            key={tf}
            onClick={() => setActiveTimeframe(tf)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap
              ${activeTimeframe === tf ? 'bg-purple-600 text-white' : 'text-muted hover:text-secondary hover:bg-surface'}`}
          >
            {tf}
          </button>
        ))}
        {/* Visible range indicator */}
        <span className="ml-auto text-[9px] text-muted whitespace-nowrap pl-2">
          {Math.min(visibleCountRef.current, candles.length)} candles
        </span>
      </div>

      {/* ── Canvas area — this is the fullscreen target ── */}
      <div
        ref={chartAreaRef}
        className="flex-1 relative min-h-0 select-none overflow-hidden"
        style={isFullscreen ? { background: 'var(--color-dark)' } : {}}
      >
        {/* Timeframes row stays visible inside fullscreen too */}
        {isFullscreen && (
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-1 px-3 py-1.5 border-b border-edge bg-card/95 backdrop-blur-sm">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                  activeTimeframe === tf ? 'bg-purple-600 text-white' : 'text-muted hover:text-secondary hover:bg-surface'
                }`}
              >
                {tf}
              </button>
            ))}
            <span className="ml-auto text-[9px] text-muted pl-2">
              {Math.min(visibleCountRef.current, candles.length)} candles
            </span>
            <button
              onClick={toggleFullscreen}
              className="ml-2 p-1.5 rounded text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
              title="Exit fullscreen (Esc)"
            >
              <Shrink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ResizeObserver watches this element */}
        <div ref={containerRef} className={`w-full h-full ${isFullscreen ? 'pt-9' : ''}`}>
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ cursor: isDragging ? 'grabbing' : 'crosshair' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        {/* Hint */}
        {candles.length > 0 && !isFullscreen && (
          <div className="absolute bottom-10 left-3 pointer-events-none">
            <div className="text-[9px] text-muted/30">Scroll to zoom · Drag to pan</div>
          </div>
        )}
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
