import { Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Zap, Shield, ArrowRight, Activity, PieChart, LineChart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Calculators from './Calculators';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-dark text-primary selection:bg-accent/30 flex flex-col font-sans overflow-x-hidden">
      
      {/* ── Navbar ── */}
      <nav className="border-b border-edge/50 bg-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Kite<span className="text-accent">Clone</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#calculators" className="hover:text-primary transition-colors">Calculators</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover active:scale-[0.98] text-white rounded-lg transition-all shadow-lg shadow-accent/20"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-secondary hover:text-primary transition-colors hidden sm:block"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2 text-sm font-semibold bg-accent hover:bg-accent-hover active:scale-[0.98] text-white rounded-lg transition-all shadow-lg shadow-accent/20"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold font-mono mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            LIVE VIRTUAL TRADING ENVIRONMENT
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight animate-slide-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            Invest in everything.<br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-purple-500">
              Risk absolutely nothing.
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            Experience the thrill of the Indian stock market with ₹1,00,000 in virtual capital. Professional tools, real-time data, and zero latency execution.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <Link
              to={user ? "/dashboard" : "/login"}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-white text-dark hover:bg-gray-100 rounded-xl transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 group"
            >
              Start Trading Now
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/about"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold bg-surface border border-edge hover:bg-surface/80 text-primary rounded-xl transition-all flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview (Abstract) ── */}
      <section className="py-20 bg-dark relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="rounded-2xl border border-edge/50 bg-card shadow-[0_0_60px_-15px_rgba(124,58,237,0.3)] overflow-hidden relative group">
            <img 
              src="/dashboard-preview.png" 
              alt="Trading Dashboard Preview" 
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.02]" 
            />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-surface/30 border-y border-edge relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Built for speed. Designed for you.
            </h2>
            <p className="text-secondary max-w-2xl mx-auto text-lg">
              Everything you need to master the markets, packaged in an incredibly intuitive interface.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 text-yellow-500" />,
                title: 'Lightning Fast',
                desc: 'Tick-by-tick real-time data powered by WebSockets. Never miss a market movement.'
              },
              {
                icon: <LineChart className="w-6 h-6 text-accent" />,
                title: 'Advanced Charting',
                desc: 'Professional-grade charts with smooth panning, exact zooming, and built-in technical indicators.'
              },
              {
                icon: <Shield className="w-6 h-6 text-emerald-500" />,
                title: 'Risk-Free Environment',
                desc: 'Test your strategies with virtual money before committing real capital to the markets.'
              }
            ].map((f, i) => (
              <div key={i} className="bg-card border border-edge rounded-2xl p-8 hover:border-accent/50 transition-colors group">
                <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Calculators ── */}
      <section id="calculators" className="py-24 bg-dark relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
              Plan your finances.
            </h2>
            <p className="text-secondary max-w-2xl mx-auto text-lg">
              Use our built-in calculators to plan your SIPs, EMIs, SWPs, and brokerages without leaving the page.
            </p>
          </div>
          
          <div className="bg-card border border-edge rounded-3xl p-6 sm:p-10 shadow-2xl">
            <Calculators />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 bg-dark border-t border-edge text-sm text-secondary">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <span className="font-bold text-white">
              Kite<span className="text-accent">Clone</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <div>
            © {new Date().getFullYear()} KiteClone. Not a real trading platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
