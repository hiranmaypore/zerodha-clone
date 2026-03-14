# 📈 Zerodha Clone — Professional Full-Stack Virtual Trading Platform

A high-fidelity, professional-grade virtual trading platform built with the **MERN Stack** (MongoDB, Express, React, Node.js). This platform features real-time price simulation, advanced algorithmic trading signals, a stunning dark/light theme system, and institutional-grade portfolio analytics.

> 💡 **Start Trading Instantly**: New users are credited with **₹1,00,000** in virtual capital to trade 20 real NSE stocks with zero financial risk.
## 🚀 V2: The Professional Overhaul

### 📊 Portfolio Analytics (Institutional-Grade)
- **Risk Assessment**: Integrated **Sharpe Ratio** (risk-adjusted returns) and **Max Drawdown** (capital protection) metrics in the Journal.
- **Sector Allocation**: A dynamic glassmorphism pie chart showing your exposure across Banking, IT, Auto, and more.
- **Deep Performance**: Track realize/unrealized P&L distributions with institutional-grade accuracy.

### 🗞️ Advanced Pulse (Market Intelligence)
- **Live Intelligence Hub**: A deep-search news feed that aggregates and filters market headlines in real-time.
- **Sentiment Bar**: A real-time market conviction gauge (Fear & Greed) derived from advance-decline ratios and volume momentum.
- **Stock Convergence**: News items are now logically linked to tickers for quick context gathering.

### 📱 Mobile-First Trading Experience
- **Kite-Style Bottom Sheets**: A premium, slide-up "Bottom Sheet" interaction for mobile trading (Buy/Sell), maximizing screen real estate.
- **Persistent Action**: A localized, floating "Quick Trade" button for instant execution on small screens.
- **Touch-Optimized**: Completely rebuilt navigation and controls for a thumb-driven mobile experience.

### 🧪 Algo Lab (Strategy Playground)
- **Historical Backtesting**: A dedicated playback engine that simulates trading strategies over historical data windows.
- **Performance Projections**: Visualize projected ROI, win rates, and equity curves before deploying capital.
- **Strategy Tuning**: Switch between EMA Crossovers, RSI Reversals, and Bollinger Breakouts in a controlled sandbox.

---

## 🎯 Core Features

### 🧠 AI & Quant Suite

| Feature                       | Description                                                                 | Status |
| ----------------------------- | --------------------------------------------------------------------------- | ------ |
| **EMA Crossover (9/21)**      | Generates BUY/SELL signals on 9-period/21-period moving average crossovers. | ✅     |
| **RSI Mean Reversion**        | Identifies overbought (>70) and oversold (<30) market conditions.           | ✅     |
| **Algo Backtester**           | **NEW**: Stress-test strategies on historical data with equity projections. | ✅ NEW |
| **Market Sentiment Bar**      | **NEW**: Real-time Fear & Greed gauge derived from market internals.        | ✅ NEW |
| **Institutional Analytics**   | **NEW**: Sharpe Ratio and Max Drawdown calculations for risk profiling.     | ✅ NEW |
| **One-Click Copy Trading**    | Instantly auto-fills order panels based on AI signals.                      | ✅     |
| **Floating Signal Feed**      | Real-time top-middle overlay for AI signal broadcasts.                      | ✅     |

### ⚡ Trading System

| Feature                     | Logic                                                                  | Status |
| --------------------------- | ---------------------------------------------------------------------- | ------ |
| **Market/Limit Orders**     | Immediate execution vs. Price-triggered matching.                      | ✅     |
| **CNC / MIS Products**      | Long-term Cash & Carry vs. Intraday Margin Intraday Square-off.        | ✅     |
| **Bracket Orders**          | Comprehensive Entry + Take-Profit + Stop-Loss legs.                    | ✅     |
| **OCO (One Cancels Other)** | Target execution auto-cancels the Stop-Loss leg and vice-versa.        | ✅     |
| **Short Selling**           | SELL first and BUY later to profit from falling prices.                | ✅     |
| **Matching Engine**         | High-performance background service processing orders every 2 seconds. | ✅     |

### 🏠 Trading Dashboard

- **Canvas Candlestick Chart**: Custom-built high-performance chart with zoom, pan, and SMA/EMA overlays.
- **Interactive Drawing**: Trendlines, H-Lines, and Fibonacci tools built directly into the custom canvas engine.
- **Performance Journal**: Dedicated stats page with win-rate, streaks, and day-of-week heatmaps.
- **Global Leaderboard**: ROI-based rankings with professional achievement badges.
- **Live Order Book**: Simulated real-time Bid/Ask depth for all 20 stocks.
- **Stat Cards**: Real-time tracking of Balance, Invested Capital, and live Day P&L.
- **Price Alerts UI**: Set and manage target price notifications.

---

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18 + Vite (@latest)
- **Styling**: Tailwind CSS v4 (with custom design tokens)
- **State Management**: React Context (Auth, Watchlist)
- **Animations**: CSS Keyframes + Framer-Motion style transitions
- **Charts**: Custom Canvas API (Candlesticks) + Recharts (Equity Curve)
- **Real-time**: Socket.IO Client

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Real-time**: Socket.IO Server
- **Auth**: JWT + bcryptjs
- **Services**: Price Simulation (Random Walk), Signal Engine (AlgoBot), Matching Engine.

---

## 📦 Installation & Setup

### 1. Prerequisites

- Node.js (v18 or higher)
- MongoDB (Local or Atlas)

### 2. Environment Variables

**Backend (`backend/.env`)**

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

**Frontend (`frontend/.env`)**

```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

### 3. Run Locally

```bash
# Terminal 1: Backend
cd backend
npm install
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

---

## 🏗️ Project Architecture

```
zerodha-clone/
├── backend/src/
│   ├── config/             # DB & Stock Metadata (Sectors added)
│   ├── controllers/        # Auth, Orders, Portfolio, Signals
│   ├── models/             # User, Order, Holding, Signal (Persistent)
│   ├── routes/             # API Endpoints (inc. Signal History)
│   ├── services/           # AlgoBot, MatchingEngine, PriceSimulator
│   └── server.js           # Server Entry & Socket.io setup
├── frontend/src/
│   ├── components/
│   │   ├── dashboard/      # Trading UI Components
│   │   ├── market/         # Option Chain & Sector Heatmap
│   │   └── ThemeToggle.jsx # Professional Sun/Moon Switcher
│   ├── context/            # Auth & Theme State
│   ├── pages/              # Dashboard, Market, Funds, Profile
│   └── services/           # API (Axios) & Socket.io client
└── index.css               # Design System & Theme Tokens
```

---

## 📈 Available Stocks

The platform tracks 20 major NSE symbols across various sectors:
`TCS`, `INFY`, `RELIANCE`, `HDFC`, `ICICI`, `SBIN`, `BHARTIARTL`, `HCLTECH`, `ITC`, `KOTAKBANK`, `LT`, `AXISBANK`, `WIPRO`, `BAJFINANCE`, `MARUTI`, `TITAN`, `SUNPHARMA`, `TATAMOTORS`, `ASIANPAINT`, `ULTRACEMCO`.

---

## 🛡️ Best Practices & Features

- **Security**: JWT-based authentication with protected API routes.
- **Performance**: Canvas-based charting and efficient WebSocket broadcasts.
- **UX**: Professional visual cues for Profit/Loss, real-time feedback, and accessible theme switching.
- **Scalability**: Centralized backend stock metadata and modular service architecture.

---

## 📖 License

Built for educational purposes as a demonstration of a modern, full-stack fintech application.

**Happy Trading! 📈**
