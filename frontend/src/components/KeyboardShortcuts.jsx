import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

/**
 * Global keyboard shortcuts for power users.
 * 
 * Shortcuts:
 *  B         → Navigate to Dashboard (Buy mode)
 *  S         → Navigate to Dashboard (Sell mode)
 *  /         → Focus search (Ctrl+K)
 *  Escape    → Close modals/panels
 *  G then D  → Go to Dashboard
 *  G then M  → Go to Market
 *  G then O  → Go to Orders
 *  G then H  → Go to Holdings
 *  G then J  → Go to Journal
 *  G then P  → Go to Pulse
 *  ?         → Show shortcuts help toast
 */
export default function KeyboardShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let gPressed = false;
    let gTimer = null;

    const handler = (e) => {
      // Ignore when typing in inputs
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      // Ctrl/Cmd combos handled elsewhere (search)
      if (e.metaKey || e.ctrlKey) return;

      const key = e.key.toLowerCase();

      // "G" prefix for navigation
      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        
        const routes = {
          d: '/dashboard',
          m: '/market',
          o: '/orders',
          h: '/holdings',
          j: '/journal',
          p: '/pulse',
          f: '/funds',
          w: '/watchlist',
          l: '/leaderboard',
          a: '/algolab',
          c: '/calculators',
        };

        if (routes[key]) {
          e.preventDefault();
          navigate(routes[key]);
          return;
        }
      }

      if (key === 'g' && !e.shiftKey) {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 800);
        return;
      }

      // Direct shortcuts
      if (key === 'b' && location.pathname !== '/dashboard') {
        navigate('/dashboard');
      }

      if (key === '?' || (key === '/' && e.shiftKey)) {
        e.preventDefault();
        toast(
          () => (
            <div className="text-xs space-y-1">
              <p className="font-bold text-sm mb-2">⌨️ Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <span className="text-muted">Ctrl+K</span><span>Search stocks</span>
                <span className="text-muted">G → D</span><span>Dashboard</span>
                <span className="text-muted">G → M</span><span>Market</span>
                <span className="text-muted">G → O</span><span>Orders</span>
                <span className="text-muted">G → H</span><span>Holdings</span>
                <span className="text-muted">G → J</span><span>Journal</span>
                <span className="text-muted">G → P</span><span>Pulse</span>
                <span className="text-muted">G → W</span><span>Watchlist</span>
                <span className="text-muted">G → L</span><span>Leaderboard</span>
                <span className="text-muted">?</span><span>This help</span>
              </div>
            </div>
          ),
          { duration: 5000, style: { background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '16px', padding: '16px' } }
        );
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      clearTimeout(gTimer);
    };
  }, [navigate, location.pathname]);

  // This component renders nothing — it's purely a side-effect hook
  return null;
}
