import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStockDetail, getSentiment, getMarketNews, getPriceHistory } from '../services/api';
import { connectSocket } from '../services/socket';
import { StockIcon } from '../components/StockIcon';
import {
  TrendingUp, TrendingDown, BarChart3, ArrowLeft,
  Activity, Target, Shield, Zap, DollarSign,
  PieChart, AlertTriangle, ChevronRight, ShoppingCart
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export default function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const [stock, setStock] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [news, setNews] = useState([]);
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [livePrice, setLivePrice] = useState(0);
  const [period, setPeriod] = useState('1d');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [detailRes, sentRes, newsRes, histRes] = await Promise.allSettled([
          getStockDetail(symbol),
          getSentiment(symbol),
          getMarketNews({ symbol, limit: 5 }),
          getPriceHistory(symbol, period),
        ]);
        if (detailRes.status === 'fulfilled') {
          setStock(detailRes.value.data.stock);
          setLivePrice(detailRes.value.data.stock.price);
        }
        if (sentRes.status === 'fulfilled') setSentiment(sentRes.value.data);
        if (newsRes.status === 'fulfilled') setNews(newsRes.value.data.news || []);
        if (histRes.status === 'fulfilled') {
          const hist = histRes.value.data.history || histRes.value.data.candles || [];
          setPriceHistory(hist.map((c, i) => ({
            time: c.time || c.t || i,
            price: c.close || c.c || c.price || 0,
          })));
        }
      } catch (e) {
        console.error('Failed to load stock detail', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [symbol, period]);

  // Live price updates
  useEffect(() => {
    const socket = connectSocket();
    const handler = (prices) => {
      if (prices[symbol]) setLivePrice(prices[symbol]);
    };
    socket.on('price_update', handler);
    socket.emit('subscribe_symbols', [symbol]);
    return () => {
      socket.off('price_update', handler);
      socket.emit('unsubscribe_symbols', [symbol]);
    };
  }, [symbol]);

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading {symbol}...</p>
      </div>
    </div>
  );

  if (!stock) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <p className="text-lg font-bold text-primary">Stock not found</p>
      <button onClick={() => navigate('/market')} className="mt-4 px-6 py-2 bg-accent text-white rounded-xl text-sm font-bold">
        Back to Market
      </button>
    </div>
  );

  const f = stock.fundamentals || {};
  const change = livePrice - stock.openPrice;
  const changePct = stock.openPrice > 0 ? (change / stock.openPrice) * 100 : 0;
  const isUp = change >= 0;

  const fmtCr = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(0)} Cr` : `₹${v.toLocaleString()}`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in p-2 md:p-6 pb-20">
      
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-card border border-edge rounded-xl text-muted hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <StockIcon symbol={stock.symbol} className="w-14 h-14" textSize="text-lg" />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{stock.symbol}</h1>
              <span className="text-xs text-muted bg-surface px-2 py-0.5 rounded-full border border-edge">{stock.sector}</span>
            </div>
            <p className="text-sm text-muted mt-0.5">{stock.name}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-primary font-mono">₹{livePrice.toFixed(2)}</p>
          <div className={`flex items-center gap-1 justify-end text-sm font-bold font-mono ${isUp ? 'text-profit' : 'text-loss'}`}>
            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isUp ? '+' : ''}{change.toFixed(2)} ({changePct.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Trade Button */}
      <button 
        onClick={() => navigate(`/dashboard?stock=${stock.symbol}`)}
        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white rounded-2xl text-sm font-bold hover:bg-accent/80 transition-all shadow-lg shadow-accent/20"
      >
        <ShoppingCart className="w-5 h-5" /> Trade {stock.symbol}
      </button>

      {/* Price Chart */}
      <div className="bg-card border border-edge rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> Price History
          </h3>
          <div className="flex gap-1">
            {['1d', '1w', '1m', '3m'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  period === p ? 'bg-accent text-white' : 'bg-surface text-muted hover:text-primary'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {priceHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? '#26A641' : '#F85149'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isUp ? '#26A641' : '#F85149'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#21262d" />
                <XAxis dataKey="time" hide />
                <YAxis domain={['auto', 'auto']} hide />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload?.[0]) return (
                    <div className="bg-card border border-edge p-2 rounded-lg text-xs shadow-xl">
                      <p className="text-primary font-bold font-mono">₹{payload[0].value.toFixed(2)}</p>
                    </div>
                  );
                  return null;
                }} />
                <Area type="monotone" dataKey="price" stroke={isUp ? '#26A641' : '#F85149'} fill="url(#priceGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted text-sm">No chart data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fundamentals */}
        <div className="lg:col-span-2 bg-card border border-edge rounded-2xl p-6">
          <h3 className="text-sm font-bold text-primary mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" /> Fundamentals
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <FundCard label="P/E Ratio" value={f.pe} icon={<Target className="w-3.5 h-3.5 text-accent" />} />
            <FundCard label="Market Cap" value={fmtCr(f.marketCap)} icon={<DollarSign className="w-3.5 h-3.5 text-profit" />} />
            <FundCard label="EPS" value={`₹${f.eps}`} icon={<TrendingUp className="w-3.5 h-3.5 text-profit" />} />
            <FundCard label="Div. Yield" value={`${f.divYield}%`} icon={<PieChart className="w-3.5 h-3.5 text-warning" />} />
            <FundCard label="P/B Ratio" value={f.pbRatio} icon={<BarChart3 className="w-3.5 h-3.5 text-muted" />} />
            <FundCard label="Beta" value={f.beta} icon={<Zap className="w-3.5 h-3.5 text-warning" />} />
            <FundCard label="ROE" value={`${f.roe}%`} icon={<TrendingUp className="w-3.5 h-3.5 text-profit" />} />
            <FundCard label="D/E Ratio" value={f.debtToEquity} icon={<AlertTriangle className="w-3.5 h-3.5 text-loss" />} />
            <FundCard label="52W Range" value={`₹${f.low52w} - ₹${f.high52w}`} icon={<Activity className="w-3.5 h-3.5 text-accent" />} wide />
          </div>
        </div>

        {/* Sentiment + News */}
        <div className="space-y-4">
          {sentiment && (
            <div className="bg-card border border-edge rounded-2xl p-5">
              <h3 className="text-sm font-bold text-primary mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" /> AI Sentiment
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <div className={`text-2xl font-bold font-mono ${sentiment.overall === 'BULLISH' ? 'text-profit' : sentiment.overall === 'BEARISH' ? 'text-loss' : 'text-warning'}`}>
                  {sentiment.overall || 'NEUTRAL'}
                </div>
              </div>
              <div className="h-2 w-full bg-surface rounded-full overflow-hidden mb-2">
                <div className="h-full bg-profit rounded-full transition-all" style={{ width: `${sentiment.score || 50}%` }} />
              </div>
              <p className="text-[10px] text-muted">Confidence: {sentiment.score || 50}%</p>
            </div>
          )}

          {/* Related News */}
          <div className="bg-card border border-edge rounded-2xl p-5">
            <h3 className="text-sm font-bold text-primary mb-4">Related News</h3>
            {news.length > 0 ? (
              <div className="space-y-3">
                {news.slice(0, 4).map(n => (
                  <div key={n.id} className="p-3 bg-surface/30 rounded-xl border border-edge/50 hover:border-accent/30 transition-all cursor-pointer">
                    <p className="text-xs text-primary font-medium leading-snug">{n.headline}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                        n.sentiment === 'Bullish' ? 'bg-profit/10 text-profit' : n.sentiment === 'Bearish' ? 'bg-loss/10 text-loss' : 'bg-surface text-muted'
                      }`}>{n.sentiment}</span>
                      <span className="text-[9px] text-muted">
                        {n.minutesAgo < 60 ? `${n.minutesAgo}m ago` : `${Math.floor(n.minutesAgo / 60)}h ago`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No recent news for {stock.symbol}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FundCard({ label, value, icon, wide }) {
  return (
    <div className={`p-3 bg-surface/30 rounded-xl border border-edge/50 ${wide ? 'col-span-2 md:col-span-3' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] text-muted font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-sm font-bold text-primary font-mono">{value}</p>
    </div>
  );
}
