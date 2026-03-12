import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getPriceHistory } from '../../services/api';
import { useAuth }        from '../../context/AuthContext';
import { useWatchlist } from '../../hooks/useWatchlist';
import { StockIcon } from '../StockIcon';
import {
  ZoomIn, ZoomOut, RotateCcw, Expand, Shrink, ChevronDown, MoveHorizontal, Star, Activity,
  Type, MousePointer2, Minus, TrendingUp as TrendIcon, Layout
} from 'lucide-react';



const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1W'];

// Bar duration in milliseconds for each timeframe
const TIMEFRAME_BAR_MS = {
  '1m':  60_000,
  '5m':  5  * 60_000,
  '15m': 15 * 60_000,
  '30m': 30 * 60_000,
  '1h':  60 * 60_000,
  '4h':  4  * 60 * 60_000,
  '1d':  24 * 60 * 60_000,
  '1W':  7  * 24 * 60 * 60_000,
};

const MIN_VISIBLE = 5;    // most zoomed-in
const MAX_VISIBLE = 300;  // most zoomed-out
const DEFAULT_VISIBLE = 70;

const THEMES = {
  dark: {
    bull: '#00b061',
    bear: '#ff5722',
    bg: '#131722',
    grid: 'rgba(43, 49, 67, 0.5)',
    text: '#d1d4dc',
    crosshair: 'rgba(157, 160, 168, 0.8)',
    watermark: 'rgba(255, 255, 255, 0.03)',
    tagBg: '#333'
  },
  light: {
    bull: '#00b061',
    bear: '#ff5722',
    bg: '#ffffff',
    grid: 'rgba(230, 233, 240, 1)',
    text: '#707a8a',
    crosshair: 'rgba(0, 0, 0, 0.2)',
    watermark: 'rgba(0, 0, 0, 0.03)',
    tagBg: '#f0f3f8'
  }
};

const ACCENT = '#2196f3';

const CHART_CACHE = {};
const CACHE_DURATION = 3 * 60 * 60 * 1000; // 3 hours

// ── Generate fallback candle data ─────────────────────────────────────────
function generateCandleData(basePrice = 1000, count = 120, barMs = 60_000) {
  const data = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const open  = price + (Math.random() - 0.48) * (basePrice * 0.008);
    const close = open  + (Math.random() - 0.45) * (basePrice * 0.012);
    const high  = Math.max(open, close) + Math.random() * (basePrice * 0.004);
    const low   = Math.min(open, close) - Math.random() * (basePrice * 0.004);
    data.push({
      time: now - (count - i) * barMs,
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

// ── Technical Indicators ──────────────────────────────────────────────────
function calcSMA(data, period) {
  const result = new Array(data.length).fill(null);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= period) sum -= data[i - period].close;
    if (i >= period - 1) result[i] = sum / period;
  }
  return result;
}

function calcEMA(data, period) {
  const result = new Array(data.length).fill(null);
  const k = 2 / (period + 1);
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema = data[i].close;
      result[i] = ema;
    } else {
      ema = (data[i].close - ema) * k + ema;
      result[i] = ema;
    }
  }
  return result;
}

export default function ChartPanel({ selectedStock, stocks = [], onStockChange, currentPrice, livePrices = {} }) {
  const { preferences } = useAuth();
  const COLORS = useMemo(() => THEMES[preferences.theme] || THEMES.dark, [preferences.theme]);

  const [activeTimeframe, setActiveTimeframe] = useState('1W');
  const [candles, setCandles]           = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [crosshair, setCrosshair]       = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);
  
  // ── Drawing Tools State ──
  const [drawingTool, setDrawingTool] = useState(null); // 'LINE', 'HLINE', 'FIB', 'TEXT'
  const [drawings, setDrawings] = useState([]);         // scale-independent (time, price)
  const [activeDrawing, setActiveDrawing] = useState(null);


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
  const redraw = useCallback(() => {
    setDrawTick(t => t + 1);
    // Keep the state mirror in sync so the candle-count badge re-renders
    setVisibleCount(visibleCountRef.current);
  }, []);

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
      const barMs = TIMEFRAME_BAR_MS[activeTimeframe] || 60_000;
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
          const fallbackData = generateCandleData(currentPrice || selectedStock.price || 1000, 120, barMs);
          CHART_CACHE[cacheKey] = { timestamp: now, data: fallbackData };
          setCandles(fallbackData);
        }
      } catch {
        const fallbackData = generateCandleData(currentPrice || selectedStock.price || 1000, 120, barMs);
        CHART_CACHE[cacheKey] = { timestamp: now, data: fallbackData };
        setCandles(fallbackData);
      }
    };
    fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, [currentPrice, candles.length]);


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
        if (cacheKeyRef.current && CHART_CACHE[cacheKeyRef.current]) {
          CHART_CACHE[cacheKeyRef.current].data = copy;
        }
        return copy;
      });
    }, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles.length === 0]);  // re-register only when candles go from empty → populated

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
    const pad = { top: 30, right: 75, bottom: 25, left: 0 };
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);
    
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    // Compute viewport slice
    const total    = candles.length;
    const visible  = Math.min(visibleCountRef.current, total);
    const offset   = Math.min(panOffsetRef.current, total - visible);
    const startIdx = Math.max(0, total - visible - offset);
    const endIdx   = total - offset;
    const slice    = candles.slice(startIdx, endIdx);

    // Indicators
    let sliceSma = [], sliceEma = [];
    if (showIndicators) {
      const smaFull = calcSMA(candles, 50);
      const emaFull = calcEMA(candles, 20);
      sliceSma = smaFull.slice(startIdx, endIdx);
      sliceEma = emaFull.slice(startIdx, endIdx);
    }

    if (slice.length === 0) return;

    // Watermark
    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.rotate(-Math.PI / 12);
    ctx.fillStyle = COLORS.watermark;
    ctx.textAlign = 'center';
    ctx.font = 'bold 80px Inter';
    ctx.fillText(selectedStock?.symbol || 'RELIANCE', 0, 0);
    ctx.restore();

    let maxP = Math.max(...slice.map(c => c.high));
    let minP = Math.min(...slice.map(c => c.low));

    if (showIndicators) {
      sliceSma.forEach(v => { if (v !== null) { maxP = Math.max(maxP, v); minP = Math.min(minP, v); }});
      sliceEma.forEach(v => { if (v !== null) { maxP = Math.max(maxP, v); minP = Math.min(minP, v); }});
    }

    // Padding (10% top/bottom)
    const rawRange = maxP - minP || 1;
    maxP += rawRange * 0.1;
    minP -= rawRange * 0.1;
    const priceRange = maxP - minP || 1;


    const gap  = chartW / Math.max(1, slice.length);
    const cw   = Math.max(2, gap * 0.8);

    const toY = p  => pad.top + chartH * (1 - (p - minP) / priceRange);
    const toX = i  => pad.left + gap * i + gap / 2;

    // ── Grid ──────────────────────────────────────────────────────────
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 1;
    ctx.setLineDash([]);
    
    // Horizontal lines
    for (let g = 0; g <= 8; g++) {
      const y = pad.top + (chartH / 8) * g;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      const p = maxP - (priceRange / 8) * g;
      ctx.fillStyle  = COLORS.text;
      ctx.font       = '11px Inter,sans-serif';
      ctx.textAlign  = 'left';
      ctx.fillText(p.toFixed(2), W - pad.right + 8, y + 4);
    }
    // Vertical time lines every ~10 candles
    // Vertical time lines
    const step = Math.max(1, Math.round(slice.length / 8));
    for (let i = 0; i < slice.length; i += step) {
      const x  = toX(i);
      const ts = new Date(slice[i].time);
      const label = ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + chartH); ctx.stroke();
      ctx.fillStyle  = COLORS.text;
      ctx.font       = '10px Inter,sans-serif';
      ctx.textAlign  = 'center';
      ctx.fillText(label, x, H - 7);
    }

    // ── Volume bars (20% H) ──────────────────────────────────────────
    const maxVol = Math.max(...slice.map(c => c.volume)) || 1;
    const volH   = chartH * 0.18;
    slice.forEach((c, i) => {
      const x    = toX(i);
      const barH = (c.volume / maxVol) * volH;
      ctx.fillStyle = c.close >= c.open
        ? 'rgba(0, 176, 97, 0.15)' : 'rgba(255, 87, 34, 0.15)'; // Subtler colors
      ctx.fillRect(x - cw / 2 + 0.5, pad.top + chartH - barH, cw - 1, barH);
    });

    // ── Candles ───────────────────────────────────────────────────────
    slice.forEach((c, i) => {
      const x    = toX(i);
      const bull = c.close >= c.open;
      const color = bull ? COLORS.bull : COLORS.bear;

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

    // ── Indicators ───────────────────────────────────────────────────
    if (showIndicators) {
      // 50 SMA (Orange)
      ctx.beginPath();
      ctx.strokeStyle = '#f97316'; // orange-500
      ctx.lineWidth = 1.5;
      for (let i = 0; i < sliceSma.length; i++) {
        if (sliceSma[i] === null) continue;
        const x = toX(i);
        const y = toY(sliceSma[i]);
        if (i === 0 || sliceSma[i - 1] === null) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 20 EMA (Blue)
      ctx.beginPath();
      ctx.strokeStyle = '#3b82f6'; // blue-500
      ctx.lineWidth = 1.5;
      for (let i = 0; i < sliceEma.length; i++) {
        if (sliceEma[i] === null) continue;
        const x = toX(i);
        const y = toY(sliceEma[i]);
        if (i === 0 || sliceEma[i - 1] === null) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // ── Live price dashed line + price tag ───────────────────────────

    const last      = slice[slice.length - 1];
    const liveP     = currentPrice || last.close;
    const livePy    = toY(liveP);
    const priceBull = liveP >= last.open;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = priceBull ? COLORS.bull : COLORS.bear;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(pad.left, livePy); ctx.lineTo(W - pad.right, livePy); ctx.stroke();
    ctx.setLineDash([]);

    const tagColor = priceBull ? COLORS.bull : COLORS.bear;
    ctx.fillStyle  = tagColor;
    roundRect(ctx, W - pad.right, livePy - 11, 75, 22, 2); ctx.fill();
    ctx.fillStyle  = '#fff';
    ctx.font       = 'bold 12px "Roboto Mono", monospace';
    ctx.textAlign  = 'center';
    ctx.fillText(liveP.toFixed(2), W - pad.right + 38, livePy + 4);

    // ── OHLC Overlay ──────────────────────────────────────────────────
    const hoverC = crosshair ? slice[Math.round((crosshair.x - pad.left) / gap - 0.5)] : last;
    if (hoverC) {
      const ox = pad.left + 15, oy = pad.top + 15;
      ctx.font = '11px Inter';
      ctx.textAlign = 'left';
      
      const drawInfo = (label, val, col, x) => {
        ctx.fillStyle = COLORS.text;
        ctx.fillText(label, x, oy);
        ctx.fillStyle = col;
        ctx.fillText(val, x + 12, oy);
      };

      const cBull = hoverC.close >= hoverC.open;
      const cCol  = cBull ? COLORS.bull : COLORS.bear;
      
      drawInfo('O', hoverC.open.toFixed(2),  cCol, ox);
      drawInfo('H', hoverC.high.toFixed(2),  cCol, ox + 65);
      drawInfo('L', hoverC.low.toFixed(2),   cCol, ox + 130);
      drawInfo('C', hoverC.close.toFixed(2), cCol, ox + 195);
      drawInfo('V', hoverC.volume.toLocaleString(), ACCENT, ox + 265);
    }

    // ── Crosshair ─────────────────────────────────────────────────────
    if (crosshair) {
      ctx.strokeStyle = COLORS.crosshair;
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(crosshair.x, pad.top); ctx.lineTo(crosshair.x, pad.top + chartH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad.left, crosshair.y); ctx.lineTo(W - pad.right, crosshair.y); ctx.stroke();
      ctx.setLineDash([]);

      // Price label on right axis
      ctx.fillStyle = COLORS.tagBg;
      roundRect(ctx, W - pad.right, crosshair.y - 11, 75, 22, 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Inter,sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('₹' + crosshair.price.toFixed(2), W - pad.right + 38, crosshair.y + 4);

      // Date label on x axis
      if (crosshair.time) {
        const dtLabel = new Date(crosshair.time).toLocaleString('en-IN', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const lw = dtLabel.length * 7 + 16;
        ctx.fillStyle = COLORS.tagBg;
        roundRect(ctx, crosshair.x - lw / 2, H - pad.bottom, lw, 20, 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 10px Inter,sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(dtLabel, crosshair.x, H - pad.bottom + 14);
      }
    }

    // ── Render Drawings ──────────────────────────────────────────────
    drawings.concat(activeDrawing ? [activeDrawing] : []).forEach(d => {
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#8B5CF6'; // purple-500

      if (d.type === 'LINE') {
        const x1 = toX(slice.findIndex(c => c.time >= d.p1.time));
        const x2 = toX(slice.findIndex(c => c.time >= d.p2.time));
        const y1 = toY(d.p1.price);
        const y2 = toY(d.p2.price);
        if (x1 >= 0 && x2 >= 0) {
           ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
           // Handles for active
           if (activeDrawing === d) {
             ctx.fillStyle = '#fff'; ctx.fillRect(x1-3, y1-3, 6, 6); ctx.fillRect(x2-3, y2-3, 6, 6);
           }
        }
      } else if (d.type === 'HLINE') {
        const y = toY(d.price);
        ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      } else if (d.type === 'FIB') {
        const x1 = toX(slice.findIndex(c => c.time >= d.p1.time));
        const x2 = toX(slice.findIndex(c => c.time >= d.p2.time));
        if (x1 >= 0 && x2 >= 0) {
          const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
          const range = d.p2.price - d.p1.price;
          levels.forEach(l => {
            const ply = toY(d.p1.price + range * l);
            ctx.strokeStyle = `rgba(139, 92, 246, ${1 - l*0.5})`;
            ctx.beginPath(); ctx.moveTo(Math.min(x1, x2), ply); ctx.lineTo(Math.max(x1, x2), ply); ctx.stroke();
            ctx.fillStyle = '#6E7681'; ctx.font = '8px Inter'; ctx.fillText(l.toString(), Math.max(x1, x2) + 4, ply + 3);
          });
        }
      }
    });

    // Store slice info for mouse calculations
    canvas._chartMeta = { pad, chartW, chartH, W, H, gap, slice, minP, priceRange };

  }, [candles, drawTick, crosshair, currentPrice, showIndicators, drawings, activeDrawing, COLORS, selectedStock?.symbol]);



  // ── Mouse: wheel = zoom-towards-mouse, drag = pan, move = crosshair ─
  const handleWheel = useCallback(e => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !canvas._chartMeta) return;

    const { pad, left, gap, slice } = canvas._chartMeta;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // 1. Identify index relative to slice
    const relativeIdx = (mouseX - pad.left) / gap;
    
    // 2. Compute total-relative index (from the right end)
    const total = candles.length;
    const currentVisible = visibleCountRef.current;
    const currentOffset = panOffsetRef.current;
    
    // index from right: offset + (slice.length - relativeIdx)
    const idxFromRight = currentOffset + (slice.length - relativeIdx);

    // 3. Zoom
    const delta = e.deltaY > 0 ? 1 : -1;
    const step = Math.max(1, Math.round(currentVisible * 0.1));
    const nextVisible = Math.min(MAX_VISIBLE, Math.max(MIN_VISIBLE, currentVisible + delta * step));
    
    if (nextVisible === currentVisible) return;

    // 4. Calculate new offset to keep the point under mouse
    // Formula: nextOffset = idxFromRight - (nextVisible * (relativeIdx / slice.length))
    // We want: relativeIdx / nextSlice.length to be roughly the same ratio
    const ratio = relativeIdx / slice.length;
    const nextOffset = Math.max(0, idxFromRight - (nextVisible * (1 - ratio)));
    
    visibleCountRef.current = nextVisible;
    panOffsetRef.current = nextOffset;
    redraw();
  }, [candles.length, redraw]);

  const handleMouseDown = useCallback(e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const meta = canvas._chartMeta;
    
    if (drawingTool && meta) {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const price = meta.minP + meta.priceRange * (1 - (my - meta.pad.top) / meta.chartH);
      const ci = Math.round((mx - meta.pad.left) / meta.gap - 0.5);
      const time = meta.slice[Math.max(0, Math.min(ci, meta.slice.length - 1))]?.time;

      if (drawingTool === 'HLINE') {
        setDrawings(prev => [...prev, { type: 'HLINE', price, id: Date.now() }]);
        setDrawingTool(null);
      } else {
        setActiveDrawing({ type: drawingTool, p1: { time, price }, p2: { time, price }, id: Date.now() });
      }
      return;
    }

    dragRef.current = { active: true, startX: e.clientX, startOffset: panOffsetRef.current };
    setIsDragging(true);
  }, [drawingTool]);


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
    if (activeDrawing) {
      setDrawings(prev => [...prev, activeDrawing]);
      setActiveDrawing(null);
      setDrawingTool(null);
    }
    dragRef.current.active = false;
    setIsDragging(false);
  }, [activeDrawing]);


  const handleMouseLeave = useCallback(() => {
    dragRef.current.active = false;
    setIsDragging(false);
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

        <div className="w-px h-4 bg-edge mx-2 hidden sm:block" />
        <button
          onClick={() => setShowIndicators(p => !p)}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
            showIndicators 
              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
              : 'text-muted hover:text-secondary hover:bg-surface border border-transparent'
          }`}
        >
          <Activity className="w-3 h-3" />
          Indicators
        </button>

        {/* Visible range indicator */}
        <span className="ml-auto text-[9px] text-muted whitespace-nowrap pl-2">
          {Math.min(visibleCount, candles.length)} candles
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

            <div className="w-px h-4 bg-edge mx-2" />
            <button
              onClick={() => setShowIndicators(p => !p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                showIndicators 
                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                  : 'text-muted hover:text-secondary hover:bg-surface border border-transparent'
              }`}
            >
              <Activity className="w-3 h-3" />
              Indicators
            </button>

            <span className="ml-auto text-[9px] text-muted pl-2">
              {Math.min(visibleCount, candles.length)} candles
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

        {/* ── Vertical Drawing Toolbar ── */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 flex flex-col gap-1 bg-card/80 backdrop-blur-md border border-edge rounded-full p-1 z-30 shadow-2xl">
           <ToolbarBtn 
             active={!drawingTool} 
             onClick={() => setDrawingTool(null)} 
             icon={<MousePointer2 className="w-4 h-4" />} 
             label="Select" 
           />
           <div className="h-px bg-edge mx-2 my-1" />
           <ToolbarBtn 
             active={drawingTool === 'LINE'} 
             onClick={() => setDrawingTool('LINE')} 
             icon={<TrendIcon className="w-4 h-4" />} 
             label="Trendline" 
           />
           <ToolbarBtn 
             active={drawingTool === 'HLINE'} 
             onClick={() => setDrawingTool('HLINE')} 
             icon={<Minus className="w-4 h-4" />} 
             label="Horizontal Line" 
           />
           <ToolbarBtn 
             active={drawingTool === 'FIB'} 
             onClick={() => setDrawingTool('FIB')} 
             icon={<Layout className="w-4 h-4" />} 
             label="Fibonacci" 
           />
           <div className="h-px bg-edge mx-2 my-1" />
           <ToolbarBtn 
             onClick={() => setDrawings([])} 
             icon={<RotateCcw className="w-4 h-4" />} 
             label="Clear Drawings" 
           />
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-full transition-all flex items-center justify-center hover:scale-110 active:scale-95 ${
        active 
          ? 'bg-accent text-white shadow-lg' 
          : 'text-muted hover:text-primary hover:bg-surface'
      }`}
    >
      {icon}
    </button>
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
