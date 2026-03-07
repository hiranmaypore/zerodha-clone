import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/api';
import {
  User, Mail, Lock, Save, Shield, LogOut,
  CheckCircle, Eye, EyeOff, Camera, Bell,
  TrendingUp, Wallet, BarChart2,
  Trophy, Medal, Target as TargetIcon, Settings2, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, refreshUser, preferences, updatePreference } = useAuth();
  const navigate = useNavigate();

  // ── Name edit ──────────────────────────────────────────────
  const [name,    setName]    = useState(user?.name  || '');
  const [saving,  setSaving]  = useState(false);
  const [nameDone, setNameDone] = useState(false);

  // ── Password change ────────────────────────────────────────
  const [curPwd,  setCurPwd]  = useState('');
  const [newPwd,  setNewPwd]  = useState('');
  const [confPwd, setConfPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdDone,   setPwdDone]   = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Save name ──────────────────────────────────────────────
  const saveName = async () => {
    if (!name.trim() || name === user?.name) return;
    setSaving(true);
    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      setNameDone(true);
      showToast('✅ Name updated successfully');
      setTimeout(() => setNameDone(false), 3000);
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ────────────────────────────────────────
  const changePassword = async () => {
    if (!curPwd || !newPwd || !confPwd) return;
    if (newPwd !== confPwd) { showToast('❌ Passwords do not match', 'error'); return; }
    if (newPwd.length < 6)  { showToast('❌ Password must be at least 6 characters', 'error'); return; }
    setPwdSaving(true);
    try {
      await updateProfile({ currentPassword: curPwd, newPassword: newPwd });
      showToast('✅ Password changed successfully');
      setCurPwd(''); setNewPwd(''); setConfPwd('');
      setPwdDone(true);
      setTimeout(() => setPwdDone(false), 3000);
    } catch (err) {
      showToast(err.response?.data?.message || '❌ Password change failed', 'error');
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      showToast('❌ Browser does not support notifications', 'error');
      return;
    }

    // If already denied, we can't request again via API
    if (Notification.permission === 'denied') {
      showToast('❌ Notifications blocked. Please enable them in browser settings.', 'error');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreference('desktopNotifications', true);
        showToast('✅ Desktop Notifications Enabled');
      } else {
        showToast('⚠️ Notification permission was not granted', 'error');
        updatePreference('desktopNotifications', false);
      }
    } catch (err) {
      console.error('Notification error:', err);
      showToast('❌ Failed to request permission', 'error');
    }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const totalProfit = (user?.balance || 0) - 100000;
  
  const getRank = (profit) => {
    if (profit >= 50000) return { title: 'Quant Master', desc: 'Elite algorithmic execution', icon: Trophy };
    if (profit >= 25000) return { title: 'Scalping Specialist', desc: 'Master of momentum', icon: Medal };
    if (profit >= 10000) return { title: 'Pro Trader', desc: 'Consistent market edge', icon: Zap };
    if (profit >= 5000)  return { title: 'Active Investor', desc: 'Building serious wealth', icon: TrendingUp };
    return { title: 'Novice Learner', desc: 'Starting your market journey', icon: User };
  };

  const rank = getRank(totalProfit);

  // Password strength
  const pwdStrength = newPwd.length === 0 ? null
    : newPwd.length < 6  ? { label: 'Weak',   color: 'bg-loss',    w: '33%'  }
    : newPwd.length < 10 ? { label: 'Medium', color: 'bg-warning', w: '66%'  }
    :                       { label: 'Strong', color: 'bg-profit',  w: '100%' };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">

      {/* ── Achievement Banner ── */}
      <div className="bg-linear-to-r from-accent/20 to-indigo-500/10 border border-accent/30 rounded-2xl p-4 flex items-center justify-between overflow-hidden relative group">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-accent rounded-xl shadow-[0_0_20px_rgba(124,58,237,0.4)]">
            <Trophy className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-primary flex items-center gap-2">
              Current Rank: <span className="text-accent underline decoration-accent/30 underline-offset-4">{rank.title}</span>
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">{rank.desc}</p>
          </div>
        </div>
        <div className="flex flex-col items-end relative z-10">
          <div className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Career Profit</div>
          <div className={`text-xl font-mono font-bold ${totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
            {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toLocaleString()}
          </div>
        </div>
        {/* Decorative background logo */}
        <Trophy className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.03] rotate-12 group-hover:rotate-0 transition-transform duration-700" />
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium border animate-fade-in
          ${toast.type === 'success' ? 'bg-profit/10 border-profit/20 text-profit'
          : 'bg-loss/10 border-loss/20 text-loss'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ── */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Profile & Settings</h1>
        <p className="text-sm text-muted mt-0.5">Manage your account information</p>
      </div>

      {/* ── Avatar + account summary ── */}
      <div className="bg-card border border-edge rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
            {initials}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 bg-surface border border-edge rounded-full flex items-center justify-center">
            <Camera className="w-3 h-3 text-muted" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-primary">{user?.name}</h2>
          <p className="text-sm text-muted">{user?.email}</p>
          <div className="flex flex-wrap gap-3 mt-3 justify-center sm:justify-start">
            <span className="flex items-center gap-1.5 text-xs text-profit bg-profit/10 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3" /> Verified Account
            </span>
            <span className="flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-3 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" /> Active Trader
            </span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 text-center shrink-0">
          <div>
            <div className="text-xs text-muted mb-0.5">Balance</div>
            <div className="text-sm font-bold text-primary font-mono">
              ₹{((user?.balance || 0) / 1000).toFixed(1)}K
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit name ── */}
      <div className="bg-card border border-edge rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-primary">Personal Information</h2>
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block font-medium">Display Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveName()}
            placeholder="Your name"
            className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:border-accent outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-xs text-muted mb-1.5 block font-medium">Email Address</label>
          <div className="flex items-center gap-2 w-full bg-surface border border-edge rounded-xl px-4 py-2.5">
            <Mail className="w-4 h-4 text-muted shrink-0" />
            <span className="text-sm text-muted">{user?.email}</span>
            <span className="ml-auto text-[10px] text-profit bg-profit/10 px-2 py-0.5 rounded-full">Verified</span>
          </div>
        </div>

        <button
          onClick={saveName}
          disabled={saving || !name.trim() || name === user?.name}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-accent/80 transition-all"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : nameDone ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {nameDone ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* ── Change password ── */}
      <div className="bg-card border border-edge rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-primary">Change Password</h2>
        </div>

        {/* Current password */}
        <div>
          <label className="text-xs text-muted mb-1.5 block font-medium">Current Password</label>
          <div className="relative">
            <input
              type={showCur ? 'text' : 'password'}
              value={curPwd}
              onChange={e => setCurPwd(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 pr-10 text-sm text-primary placeholder-muted focus:border-accent outline-none transition-all"
            />
            <button onClick={() => setShowCur(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
              {showCur ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New password */}
        <div>
          <label className="text-xs text-muted mb-1.5 block font-medium">New Password</label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="Enter new password"
              className="w-full bg-surface border border-edge rounded-xl px-4 py-2.5 pr-10 text-sm text-primary placeholder-muted focus:border-accent outline-none transition-all"
            />
            <button onClick={() => setShowNew(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength bar */}
          {pwdStrength && (
            <div className="mt-2">
              <div className="h-1 bg-surface rounded-full overflow-hidden">
                <div className={`h-full ${pwdStrength.color} rounded-full transition-all`} style={{ width: pwdStrength.w }} />
              </div>
              <p className={`text-[10px] mt-1 ${
                pwdStrength.label === 'Strong' ? 'text-profit' :
                pwdStrength.label === 'Medium' ? 'text-warning' : 'text-loss'}`}>
                {pwdStrength.label} password
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="text-xs text-muted mb-1.5 block font-medium">Confirm New Password</label>
          <input
            type="password"
            value={confPwd}
            onChange={e => setConfPwd(e.target.value)}
            placeholder="Re-enter new password"
            className={`w-full bg-surface border rounded-xl px-4 py-2.5 text-sm text-primary placeholder-muted focus:outline-none transition-all
              ${confPwd && newPwd !== confPwd ? 'border-loss focus:border-loss' : 'border-edge focus:border-accent'}`}
          />
          {confPwd && newPwd !== confPwd && (
            <p className="text-[10px] text-loss mt-1">Passwords do not match</p>
          )}
        </div>

        <button
          onClick={changePassword}
          disabled={pwdSaving || !curPwd || !newPwd || !confPwd || newPwd !== confPwd}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-accent/80 transition-all"
        >
          {pwdSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : pwdDone ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
          {pwdDone ? 'Password Changed!' : 'Update Password'}
        </button>
      </div>

      {/* ── Preferences ── */}
      <div className="bg-card border border-edge rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-semibold text-primary">Preferences</h2>
        </div>
        <div className="space-y-3">
          {/* Strategy Selection */}
          <div className="py-2 border-b border-edge">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm text-primary font-medium">Algo Strategy</p>
                <p className="text-[11px] text-muted text-pretty">Filter which algorithm logic generates your feed</p>
              </div>
            </div>
            <div className="flex gap-2 p-1 bg-surface border border-edge rounded-xl w-fit">
              {['ALL', 'EMA', 'RSI'].map(s => (
                <button
                  key={s}
                  onClick={() => updatePreference('selectedStrategy', s)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                    preferences.selectedStrategy === s ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {[
            { label: 'AlgoBot Signal Feed',      sub: 'Show live BUY/SELL signals on dashboard', on: preferences.showAlgoSignals, key: 'showAlgoSignals' },
            { 
              label: 'Desktop Notifications',  
              sub: 'Get browser alerts for AI signals',        
              on: preferences.desktopNotifications, 
              key: 'desktopNotifications',
              toggle: (on) => {
                if (!on) {
                  requestNotificationPermission();
                } else {
                  updatePreference('desktopNotifications', false);
                }
              }
            },
            { label: 'Order fill notifications', sub: 'Get notified when your orders execute', on: preferences.orderNotifications, key: 'orderNotifications' },
            { label: 'Price alerts',             sub: 'Alerts when stocks hit target prices',  on: preferences.priceAlerts, key: 'priceAlerts' },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between py-2 border-b border-edge last:border-0">
              <div>
                <p className="text-sm text-primary">{p.label}</p>
                <p className="text-[11px] text-muted">{p.sub}</p>
              </div>
              {/* Toggle */}
              <div 
                onClick={() => p.toggle ? p.toggle(p.on) : p.key && updatePreference(p.key, !p.on)}
                className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${p.on ? 'bg-accent' : 'bg-surface border border-edge'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${p.on ? 'left-5' : 'left-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Custom Algo Architect ── */}
      <div className="bg-card border border-edge rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-primary">Algo Architect</h2>
          </div>
          <span className="text-[9px] font-bold px-2 py-0.5 bg-accent/10 text-accent rounded-full">BETA PRO</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* EMA Settings */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3 h-3" /> Indicator Tuner
            </h3>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-secondary font-medium">Fast EMA (Period)</label>
                  <span className="text-xs font-bold text-accent font-mono">{preferences.fastEMA}</span>
                </div>
                <input 
                  type="range" min="3" max="50" 
                  value={preferences.fastEMA} 
                  onChange={(e) => updatePreference('fastEMA', parseInt(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-secondary font-medium">Slow EMA (Period)</label>
                  <span className="text-xs font-bold text-accent font-mono">{preferences.slowEMA}</span>
                </div>
                <input 
                  type="range" min="10" max="200" 
                  value={preferences.slowEMA} 
                  onChange={(e) => updatePreference('slowEMA', parseInt(e.target.value))}
                  className="w-full accent-accent h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Risk settings */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
              <TargetIcon className="w-3 h-3" /> Risk Controller
            </h3>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-secondary font-medium">Default Stop Loss (%)</label>
                  <span className="text-xs font-bold text-loss font-mono">{preferences.defaultSL}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="10" step="0.5"
                  value={preferences.defaultSL} 
                  onChange={(e) => updatePreference('defaultSL', parseFloat(e.target.value))}
                  className="w-full accent-loss h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-secondary font-medium">Auto-Target (%)</label>
                  <span className="text-xs font-bold text-profit font-mono">{preferences.defaultTarget}%</span>
                </div>
                <input 
                  type="range" min="1" max="50" step="1"
                  value={preferences.defaultTarget} 
                  onChange={(e) => updatePreference('defaultTarget', parseFloat(e.target.value))}
                  className="w-full accent-profit h-1.5 bg-surface rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-surface border border-edge rounded-xl">
           <p className="text-[10px] text-muted-foreground leading-relaxed">
             💡 These parameters will be used to automatically set <strong>Stop-Loss</strong> and <strong>Target</strong> legs when you click <strong>"Copy Trade"</strong> on any AI Signal. Adjust them to match your risk appetite.
           </p>
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div className="bg-card border border-loss/20 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-loss mb-3">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary">Log out of all devices</p>
            <p className="text-[11px] text-muted mt-0.5">This will terminate all active sessions</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-loss/10 border border-loss/20 text-loss rounded-xl text-sm font-semibold hover:bg-loss/20 transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

    </div>
  );
}
