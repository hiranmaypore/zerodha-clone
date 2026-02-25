import { useState, useEffect } from 'react';
import { getBalance, depositFunds, withdrawFunds } from '../services/api';
import { Wallet, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export default function Funds() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadBalance(); }, []);

  const loadBalance = async () => {
    try {
      const res = await getBalance();
      setBalance(res.data.balance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (action) => {
    if (!amount || parseFloat(amount) <= 0) return;
    setActionLoading(true);
    try {
      if (action === 'deposit') {
        await depositFunds(parseFloat(amount));
        showToast(`₹${parseFloat(amount).toLocaleString()} deposited!`);
      } else {
        await withdrawFunds(parseFloat(amount));
        showToast(`₹${parseFloat(amount).toLocaleString()} withdrawn!`);
      }
      setAmount('');
      loadBalance();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">Funds</h1>
        <p className="text-secondary text-sm mt-1">Manage your trading balance</p>
      </div>

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-2xl text-sm animate-slide-in
          ${toast.type === 'error' ? 'bg-loss-dim text-loss border border-loss/30' : 'bg-profit-dim text-profit border border-profit/30'}`}>
          {toast.msg}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-card border border-edge rounded-xl p-8 text-center">
        <Wallet className="w-10 h-10 text-accent mx-auto mb-3" />
        <p className="text-sm text-secondary mb-2">Available Balance</p>
        <p className="text-4xl font-bold text-primary">
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Amount Input */}
      <div className="bg-card border border-edge rounded-xl p-6">
        <label className="block text-sm text-secondary mb-2">Amount (₹)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full text-lg py-3"
          min="1"
        />

        {/* Quick amounts */}
        <div className="flex gap-2 mt-3">
          {[1000, 5000, 10000, 50000].map(a => (
            <button
              key={a}
              onClick={() => setAmount(a.toString())}
              className="px-3 py-1.5 text-xs font-medium bg-dark border border-edge rounded-lg text-secondary hover:text-primary hover:border-accent/30 transition-all cursor-pointer"
            >
              ₹{a.toLocaleString()}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleAction('deposit')}
            disabled={actionLoading || !amount}
            className="flex-1 py-3 bg-profit hover:bg-profit/80 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ArrowDownToLine className="w-4 h-4" />
            Deposit
          </button>
          <button
            onClick={() => handleAction('withdraw')}
            disabled={actionLoading || !amount}
            className="flex-1 py-3 bg-loss hover:bg-loss/80 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
