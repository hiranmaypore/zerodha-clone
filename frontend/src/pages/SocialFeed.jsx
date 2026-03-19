import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getSocket } from '../services/socket';
import API from '../services/api';
import { 
  Users, TrendingUp, TrendingDown, Clock, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Filter, Zap, MessageCircle
} from 'lucide-react';

export default function SocialFeed() {
  const { user } = useAuth();
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, BUY, SELL

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/orders/feed');
      if (data.success) setFeed(data.feed);
    } catch (err) {
      console.error('Feed load failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Real-time updates via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (data) => {
      setFeed(prev => [{
        ...data,
        _id: Date.now(),
        createdAt: new Date().toISOString(),
        user: { name: data.traderName || 'Trader' },
        status: 'COMPLETED'
      }, ...prev].slice(0, 50));
    };

    socket.on('order_executed', handler);
    return () => socket.off('order_executed', handler);
  }, []);

  const filtered = filter === 'ALL' ? feed : feed.filter(t => t.type === filter);

  const timeAgo = (dateStr) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in p-4 lg:p-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
            <Users className="w-8 h-8 text-accent fill-accent/20" /> Community Feed
          </h1>
          <p className="text-sm text-muted mt-1.5">
            See what fellow traders are buying and selling in real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Chips */}
          {['ALL', 'BUY', 'SELL'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                filter === f
                  ? f === 'BUY' ? 'bg-profit/10 border-profit/30 text-profit' :
                    f === 'SELL' ? 'bg-loss/10 border-loss/30 text-loss' :
                    'bg-accent/10 border-accent/30 text-accent'
                  : 'bg-surface border-edge text-muted hover:text-primary'
              }`}
            >
              {f === 'ALL' && <Filter className="w-3 h-3 inline mr-1.5" />}
              {f === 'BUY' && <ArrowUpRight className="w-3 h-3 inline mr-1" />}
              {f === 'SELL' && <ArrowDownRight className="w-3 h-3 inline mr-1" />}
              {f}
            </button>
          ))}

          <button
            onClick={loadFeed}
            disabled={loading}
            className="p-2 border border-edge rounded-full text-muted hover:text-primary hover:border-accent transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Counter */}
      <div className="bg-card border border-edge rounded-2xl px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-profit animate-pulse"></div>
          <span className="text-xs font-bold text-muted">
            <span className="text-primary">{feed.length}</span> trades in the timeline
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3 text-profit" />
            <span className="font-bold text-profit">{feed.filter(t => t.type === 'BUY').length}</span> Buys
          </span>
          <span className="flex items-center gap-1.5">
            <ArrowDownRight className="w-3 h-3 text-loss" />
            <span className="font-bold text-loss">{feed.filter(t => t.type === 'SELL').length}</span> Sells
          </span>
        </div>
      </div>

      {/* Feed Timeline */}
      {loading && feed.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border border-edge rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-surface rounded w-1/3"></div>
                  <div className="h-2 bg-surface rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-edge rounded-3xl p-16 text-center">
          <MessageCircle className="w-12 h-12 text-muted/30 mx-auto mb-4" />
          <p className="text-muted text-sm">No trades yet. Start trading to see activity here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade, i) => {
            const isBuy = trade.type === 'BUY';
            const traderName = trade.user?.name || 'Anonymous';
            const isMe = traderName === user?.name;
            const totalValue = ((trade.price || 0) * (trade.quantity || 0));

            return (
              <div
                key={trade._id || i}
                className={`bg-card border rounded-2xl p-5 transition-all hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5 ${
                  isMe ? 'border-accent/30 ring-1 ring-accent/10' : 'border-edge'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                    isBuy ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                  }`}>
                    {isBuy ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-primary truncate">
                          {isMe ? 'You' : traderName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">YOU</span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isBuy ? 'bg-profit/10 text-profit' : 'bg-loss/10 text-loss'
                        }`}>
                          {trade.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {trade.createdAt ? timeAgo(trade.createdAt) : 'just now'}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline flex-wrap gap-x-4 gap-y-1">
                      <span className="text-base font-black text-primary tracking-tight">{trade.stock}</span>
                      <span className="text-xs text-muted">
                        {trade.quantity} shares @ <span className="font-mono font-bold text-primary">₹{trade.price?.toFixed(2)}</span>
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
                      <span className="bg-surface px-2 py-0.5 rounded-full font-mono font-bold">
                        ₹{totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                      <span className="uppercase tracking-wider">{trade.productType || 'CNC'}</span>
                      <span className="uppercase tracking-wider">{trade.orderType || 'MARKET'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Hint */}
      <div className="text-center py-4">
        <p className="text-[10px] text-muted/50 uppercase tracking-widest font-bold flex items-center justify-center gap-2">
          <Zap className="w-3 h-3" /> Live updates powered by WebSocket
        </p>
      </div>
    </div>
  );
}
