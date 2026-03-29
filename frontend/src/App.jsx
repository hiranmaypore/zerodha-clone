import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Orders from './pages/Orders';
import Holdings from './pages/Holdings';
import Watchlist from './pages/Watchlist';
import Funds from './pages/Funds';
import Calculators from './pages/Calculators';
import Profile from './pages/Profile';
import Journal from './pages/Journal';
import Leaderboard from './pages/Leaderboard';
import AlgoLab from './pages/AlgoLab';
import Pulse from './pages/Pulse';
import Bids from './pages/Bids';
import StockDetail from './pages/StockDetail';
import SIPSimulator from './pages/SIPSimulator';
import MultiChart from './pages/MultiChart';
import SocialFeed from './pages/SocialFeed';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

            {/* Protected */}
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/market" element={<Market />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/holdings" element={<Holdings />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/funds" element={<Funds />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/algolab" element={<AlgoLab />} />
              <Route path="/pulse" element={<Pulse />} />
              <Route path="/bids" element={<Bids />} />
              <Route path="/stock/:symbol" element={<StockDetail />} />
              <Route path="/calculators" element={<Calculators />} />
              <Route path="/sip" element={<SIPSimulator />} />
              <Route path="/multichart" element={<MultiChart />} />
              <Route path="/community" element={<SocialFeed />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
