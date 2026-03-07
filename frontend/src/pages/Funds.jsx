import { useState, useEffect, useCallback } from 'react';
import { getBalance, depositFunds, withdrawFunds, getDashboard, getEquityCurve } from '../services/api';
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, Shield,
  TrendingUp, Clock, CheckCircle, XCircle, Info,
  PiggyBank, CreditCard, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';

const QUICK_AMOUNTS = [1_000, 5_000, 10_000, 25_000, 50_000, 1_00_000];

// Simulated transaction log (in-memory per session)
const txLog = [];

export default function Funds() {
  const [balance,   setBalance]   = useState(0);
  const [invested,  setInvested]  = useState(0);
  const [history,   setHistory]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [mode,      setMode]      = useState('deposit');   // 'deposit' | 'withdraw'
  const [amount,    setAmount]    = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState(txLog);
  const [toast,     setToast]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, dashRes, histRes] = await Promise.allSettled([
        getBalance(),
        getDashboard(),
        getEquityCurve()
      ]);
      
      if (balRes.status === 'fulfilled')  setBalance(balRes.value.data.balance || 0);
      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data?.dashboard;
        if (d?.portfolio?.totalInvested) setInvested(d.portfolio.totalInvested);
      }
      if (histRes.status === 'fulfilled') {
         setHistory(histRes.value.data.history || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setSubmitting(true);
    try {
      let res;
      if (mode === 'deposit') {
        res = await depositFunds(amt);
      } else {
        res = await withdrawFunds(amt);
      }
      const newBal = res.data.balance ?? (mode === 'deposit' ? balance + amt : balance - amt);
      setBalance(newBal);

      // push to local transaction log
      const tx = {
        id: Date.now(),
        type: mode,
        amount: amt,
        balance: newBal,
        status: 'COMPLETED',
        time: new Date(),
      };
      txLog.unshift(tx);
      setTransactions([...txLog]);

      showToast(
        mode === 'deposit'
          ? `✅ ₹${fmt(amt)} deposited successfully`
          : `✅ ₹${fmt(amt)} withdrawn successfully`,
        'success'
      );
      setAmount('');
      load(); // Reload to update chart info if needed
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Transaction failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) =>
    n >= 1e5 ? `${(n / 1e5).toFixed(2)}L` :
    n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` :
    n.toFixed(2);

  const fmtFull = (n) =>
    n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const netWorth  = balance + invested;
  const margin    = netWorth > 0 ? (balance / netWorth) * 100 : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  );

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-edge p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
          <p className="text-[10px] text-muted-foreground mb-1">
            {new Date(payload[0].payload.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <p className="text-sm font-bold text-accent">₹{fmtFull(payload[0].value)}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-profit" />
            <span className="text-[10px] text-muted">Portfolio Value</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-fade-in
          ${toast.type === 'success' ? 'bg-profit/10 border-profit/20 text-profit'
          : toast.type === 'error'   ? 'bg-loss/10   border-loss/20   text-loss'
          :                            'bg-card       border-edge       text-primary'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Funds</h1>
        <p className="text-sm text-muted mt-0.5">Manage your trading balance</p>
      </div>

      {/* ── Overview & Equity Curve ── */}
      <div className="bg-card border border-edge rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {/* Equity Chart */}
          <div className="lg:col-span-2 p-6 border-r border-edge bg-surface/30">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-primary flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-profit" /> Portfolio Equity Curve
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Growth of total assets (Cash + Holdings)</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted">Current Value</p>
                <p className="text-lg font-bold font-mono text-primary">₹{fmtFull(netWorth)}</p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-edge" />
                  <XAxis 
                    dataKey="timestamp" 
                    hide 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    hide 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="netWorth" 
                    stroke="#7c3aed" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorNet)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="p-6 space-y-6 bg-card flex flex-col justify-center">
             <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg">
                    <Wallet className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-semibold text-secondary">Available Cash</span>
                </div>
                <p className="text-2xl font-bold font-mono text-primary">₹{fmtFull(balance)}</p>
                <div className="mt-3">
                   <div className="flex justify-between text-[10px] text-muted mb-1">
                     <span>Margin Utilisation</span>
                     <span>{(100 - margin).toFixed(1)}%</span>
                   </div>
                   <div className="h-1 bg-surface rounded-full overflow-hidden">
                     <div className="h-full bg-accent rounded-full" style={{ width: `${100 - margin}%` }} />
                   </div>
                </div>
             </div>

             <div className="pt-6 border-t border-edge grid grid-cols-2 gap-4">
                <div>
                   <p className="text-[10px] text-muted uppercase font-bold tracking-tight mb-1">Invested</p>
                   <p className="text-sm font-bold font-mono text-primary">₹{fmt(invested)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted uppercase font-bold tracking-tight mb-1">Max Drawdown</p>
                  <p className="text-sm font-bold font-mono text-loss">0.00%</p>
                </div>
             </div>

             <div className="p-3 bg-profit/5 border border-profit/20 rounded-xl flex items-center gap-3">
                <Activity className="w-4 h-4 text-profit shrink-0" />
                <p className="text-[10px] text-profit leading-snug">Your portfolio is currently <strong>outperforming</strong> the benchmark by 2.4% this week.</p>
             </div>
          </div>
        </div>
      </div>

      {/* ── Deposit / Withdraw panel ── */}
      <div className="bg-card border border-edge rounded-2xl overflow-hidden">
        {/* Tab toggle */}
        <div className="flex border-b border-edge">
          <button
            onClick={() => { setMode('deposit'); setAmount(''); }}
            className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all
              ${mode === 'deposit'
                ? 'text-profit border-b-2 border-profit bg-profit/5'
                : 'text-muted hover:text-primary'}`}
          >
            <ArrowDownToLine className="w-4 h-4" /> Deposit
          </button>
          <button
            onClick={() => { setMode('withdraw'); setAmount(''); }}
            className={`flex-1 py-3.5 flex items-center justify-center gap-2 text-sm font-semibold transition-all
              ${mode === 'withdraw'
                ? 'text-loss border-b-2 border-loss bg-loss/5'
                : 'text-muted hover:text-primary'}`}
          >
            <ArrowUpFromLine className="w-4 h-4" /> Withdraw
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Amount input */}
          <div>
            <label className="text-xs text-muted mb-2 block font-medium">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-lg font-bold">₹</span>
              <input
                type="number"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3.5 bg-surface border border-edge rounded-xl text-xl font-bold text-primary font-mono placeholder-muted/40 focus:border-accent outline-none transition-all"
              />
            </div>
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-[10px] text-muted mb-2 uppercase tracking-wide font-medium">Quick Select</p>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_AMOUNTS.map(a => (
                <button
                  key={a}
                  onClick={() => setAmount(a.toString())}
                  className={`py-2 rounded-xl text-xs font-semibold transition-all border
                    ${amount === a.toString()
                      ? mode === 'deposit'
                        ? 'bg-profit/10 border-profit/30 text-profit'
                        : 'bg-loss/10   border-loss/30   text-loss'
                      : 'bg-surface border-edge text-secondary hover:text-primary hover:border-accent/30'}`}
                >
                  ₹{a >= 1e5 ? `${(a/1e5).toFixed(0)}L` : a >= 1e3 ? `${(a/1e3).toFixed(0)}K` : a}
                </button>
              ))}
            </div>
          </div>

          {/* Summary row */}
          {amount > 0 && (
            <div className="bg-surface rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-muted">
                {mode === 'deposit' ? 'New balance after deposit' : 'Remaining after withdrawal'}
              </span>
              <span className={`font-mono font-bold text-sm
                ${mode === 'withdraw' && (balance - parseFloat(amount)) < 0 ? 'text-loss' : 'text-primary'}`}>
                ₹{fmtFull(
                  mode === 'deposit'
                    ? balance + parseFloat(amount || 0)
                    : balance - parseFloat(amount || 0)
                )}
              </span>
            </div>
          )}

          {/* Insufficient funds warning */}
          {mode === 'withdraw' && amount > 0 && parseFloat(amount) > balance && (
            <div className="flex items-center gap-2 text-xs text-loss bg-loss/10 border border-loss/20 rounded-xl px-4 py-3">
              <Info className="w-4 h-4 shrink-0" />
              Insufficient balance. You have ₹{fmtFull(balance)} available.
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleSubmit}
            disabled={
              submitting || !amount || parseFloat(amount) <= 0 ||
              (mode === 'withdraw' && parseFloat(amount) > balance)
            }
            className={`w-full py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2
              ${mode === 'deposit'
                ? 'bg-profit hover:bg-profit/80'
                : 'bg-loss   hover:bg-loss/80'}`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'deposit'
                  ? <ArrowDownToLine className="w-4 h-4" />
                  : <ArrowUpFromLine className="w-4 h-4" />}
                {mode === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
              </>
            )}
          </button>

          {/* Security note */}
          <div className="flex items-center gap-2 text-[10px] text-muted">
            <Shield className="w-3.5 h-3.5 shrink-0" />
            Transactions are secured and processed instantly. Max deposit: ₹1 Crore per transaction.
          </div>
        </div>
      </div>

      {/* ── Transaction history ── */}
      {transactions.length > 0 && (
        <div className="bg-card border border-edge rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-edge flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" />
            <h2 className="text-sm font-semibold text-primary">Session Transactions</h2>
          </div>
          <div className="divide-y divide-edge">
            {transactions.map(tx => (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                    ${tx.type === 'deposit' ? 'bg-profit/10' : 'bg-loss/10'}`}>
                    {tx.type === 'deposit'
                      ? <ArrowDownToLine className="w-4 h-4 text-profit" />
                      : <ArrowUpFromLine className="w-4 h-4 text-loss" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary capitalize">{tx.type}</p>
                    <p className="text-[10px] text-muted">
                      {tx.time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-mono font-bold text-sm ${tx.type === 'deposit' ? 'text-profit' : 'text-loss'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₹{fmtFull(tx.amount)}
                  </p>
                  <p className="text-[10px] text-muted font-mono">Bal: ₹{fmt(tx.balance)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card border border-edge rounded-xl p-4 flex gap-3">
          <div className="p-2 bg-accent/10 rounded-xl shrink-0">
            <CreditCard className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary mb-0.5">Instant Settlement</p>
            <p className="text-xs text-muted">Deposits are credited instantly to your trading account.</p>
          </div>
        </div>
        <div className="bg-card border border-edge rounded-xl p-4 flex gap-3">
          <div className="p-2 bg-profit/10 rounded-xl shrink-0">
            <Shield className="w-4 h-4 text-profit" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary mb-0.5">Secure & Protected</p>
            <p className="text-xs text-muted">All transactions are encrypted and SEBI compliant.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
