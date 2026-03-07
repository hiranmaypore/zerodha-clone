import axios from 'axios';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


const API = axios.create({
  baseURL: backendUrl,
  headers: { 'Content-Type': 'application/json' }
});


// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// Auth
export const signup = (data) => API.post('/auth/signup', data);
export const login = (data) => API.post('/auth/login', data);
export const getProfile = () => API.get('/auth/profile');
export const updateProfile = (data) => API.put('/auth/profile', data);

// Stocks
export const getAllStocks = () => API.get('/stocks');
export const getSentiment = (symbol) => API.get(`/stocks/${symbol}/sentiment`);

// Orders
export const buyOrder = (data) => API.post('/orders/buy', data);
export const sellOrder = (data) => API.post('/orders/sell', data);
export const getOrders = () => API.get('/orders');
export const cancelOrder = (id) => API.delete(`/orders/${id}`);
export const placeStopLoss = (data) => API.post('/orders/stop-loss', data);
export const placeBracket = (data) => API.post('/orders/bracket', data);

// Holdings & Dashboard
export const getHoldings = () => API.get('/holdings');
export const getPositions = () => API.get('/holdings/positions');
export const getDashboard = () => API.get('/holdings/dashboard');
export const downloadTaxStatement = () => API.get('/holdings/export', { responseType: 'blob' });


// Watchlist
export const getWatchlist = () => API.get('/watchlist');
export const addToWatchlist = (symbol) => API.post('/watchlist', { symbol });
export const removeFromWatchlist = (symbol) => API.delete(`/watchlist/${symbol}`);

// Funds
export const getBalance = () => API.get('/funds');
export const depositFunds = (amount) => API.post('/funds/deposit', { amount });
export const withdrawFunds = (amount) => API.post('/funds/withdraw', { amount });

// Prices
export const getPrice = (symbol) => API.get(`/prices/${symbol}`);
export const getPriceHistory = (symbol, period) => API.get(`/prices/history/${symbol}?period=${period || '1d'}`);

// Calculators
export const calcSIP = (data) => API.post('/calculators/sip', data);
export const calcStepUpSIP = (data) => API.post('/calculators/step-up-sip', data);
export const calcEMI = (data) => API.post('/calculators/emi', data);
export const calcSWP = (data) => API.post('/calculators/swp', data);
export const calcRetirement = (data) => API.post('/calculators/retirement', data);
export const calcNPS = (data) => API.post('/calculators/nps', data);
export const calcSTP = (data) => API.post('/calculators/stp', data);
export const calcBrokerage = (data) => API.post('/calculators/brokerage', data);
export const calcFOMargin = (data) => API.post('/calculators/fo-margin', data);
export const calcBlackScholes = (data) => API.post('/calculators/black-scholes', data);

// Alerts
export const getAlerts = () => API.get('/alerts');
export const createAlert = (data) => API.post('/alerts', data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);

export default API;

