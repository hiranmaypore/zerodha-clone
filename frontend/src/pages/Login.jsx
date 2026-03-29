import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BarChart3, Mail, Lock, User, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col lg:flex-row">
      
      {/* ── Left Side (Branding/Marketing) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden bg-surface/50 border-r border-edge">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-linear-to-br from-purple-500/10 via-transparent to-transparent" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 bg-accent/20 rounded-full blur-[100px]" />
        
        {/* Top Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Kite<span className="text-accent">Clone</span>
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 max-w-md mt-16">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Master the markets with virtual capital.
          </h1>
          <p className="text-lg text-secondary leading-relaxed mb-8">
            Experience real-time market data, advanced charting, and instant execution without the financial risk.
          </p>
          
          {/* Feature list */}
          <div className="space-y-4">
            {[
              { label: 'Real-time WebSocket data', value: '< 50ms latency' },
              { label: 'Virtual Starting Balance', value: '₹1,00,000' },
              { label: 'Live P&L Tracking', value: 'Tick-by-tick' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 bg-card/50 backdrop-blur-sm border border-edge/50 rounded-xl p-3 w-fit">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-secondary">{f.label}</div>
                  <div className="font-bold text-primary font-mono">{f.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="relative z-10 text-xs text-muted">
          © {new Date().getFullYear()} KiteClone. Not a real trading platform.
        </div>
      </div>

      {/* ── Right Side (Form) ── */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-12 relative animate-fade-in">
        
        {/* Mobile Logo (hidden on desktop) */}
        <div className="lg:hidden flex items-center justify-center gap-2 mb-10">
          <BarChart3 className="w-8 h-8 text-accent" />
          <span className="text-2xl font-bold tracking-tight text-white">
            Kite<span className="text-accent">Clone</span>
          </span>
        </div>

        <div className="w-full max-w-sm mx-auto">
          
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-secondary">
              {isLogin ? 'Enter your details to access your dashboard.' : 'Start your simulated trading journey today.'}
            </p>
          </div>

          <div className="bg-card border border-edge shadow-2xl rounded-2xl p-6 sm:p-8">
            {/* Tabs */}
            <div className="flex bg-dark rounded-xl p-1 mb-6 border border-edge/50">
              <button
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isLogin ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  !isLogin ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
                }`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-5 flex items-start gap-2 p-3 bg-loss-dim border border-loss/20 rounded-xl text-loss text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="mt-0.5">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Animated Full Name Field */}
              <div
                className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col justify-end ${
                  !isLogin ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 mt-0!'
                }`}
              >
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 bg-dark border border-edge rounded-xl px-4 py-3 text-sm text-primary placeholder-muted focus:border-accent transition-colors outline-none"
                      required={!isLogin}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondary mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 bg-dark border border-edge rounded-xl px-4 py-3 text-sm text-primary placeholder-muted focus:border-accent transition-colors outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-secondary uppercase tracking-wider">Password</label>
                  {isLogin && (
                    <a href="#" className="text-xs text-accent hover:text-accent-hover transition-colors font-medium relative z-10">Forgot?</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 bg-dark border border-edge rounded-xl px-4 py-3 text-sm text-primary placeholder-muted focus:border-accent transition-colors outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-accent hover:bg-accent-hover active:scale-[0.98] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-accent/20 hover:shadow-accent/40"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="transition-all duration-300">
                      {isLogin ? 'Sign In to Dashboard' : 'Open Demo Account'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

