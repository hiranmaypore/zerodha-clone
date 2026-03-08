# 📈 Zerodha Clone — Professional Full-Stack Virtual Trading Platform

A high-fidelity, professional-grade virtual trading platform built with the **MERN Stack** (MongoDB, Express, React, Node.js). This platform features real-time price simulation, advanced algorithmic trading signals, a stunning dark/light theme system, and institutional-grade portfolio analytics.

> 💡 **Start Trading Instantly**: New users are credited with **₹1,00,000** in virtual capital to trade 20 real NSE stocks with zero financial risk.

---

## 🚀 What's New: Professional Upgrades

### 🌓 High-Fidelity Theme System

- **CopyCase Switcher**: A premium, animated Sun/Moon toggle (inspired by CopyCase Dribbble design) with custom CSS micro-animations.
- **Adaptive Design**: Semantic CSS variables ensure every component (cards, charts, buttons) adapts its visual language perfectly between Dark and Light modes.
- **State Persistence**: Your theme preference is preserved across sessions using LocalStorage.

### 🔥 Market Heatmap & Sector Analysis

- **Sector Rotation**: Visualize which sectors (Banking, IT, Auto, FMCG, etc.) are currently leading the market.
- **Live Performance**: Real-time "Day Change %" calculation based on backend-verified opening prices.
- **Visual Intelligence**: Interactive heatmap blocks that shift colors based on sector-wide momentum.

### 🤖 Persistent AI Trading Signals

- **Signal Persistence**: Every AI-generated signal (EMA Crossover & RSI Mean Reversion) is now saved to MongoDB.
- **Historical Feed**: The dashboard loads the last 5 high-probability signals instantly, ensuring you never miss a trade even if you refresh the page.
- **Signal Model**: High-fidelity data including strategy type, ticker, price, and timestamp.

### 📊 Portfolio Equity Curve

- **Net Worth Tracking**: Automatic snapshots of your total wealth (Cash + Holdings Value).
- **Interactive Recharts**: A professional Area Chart on the Funds page to visualize your performance over time like a fund manager.
- **Theme-Aware Scaling**: Chart grids and labels automatically adjust for maximum legibility in light and dark modes.

### 📜 Professional Trade Journaling

- **Win-Rate Tracker**: Institutional-grade analytics showing your profit percentage and current winning streaks.
- **Daily Heatmap**: Visualize which days of the week you are most profitable using high-fidelity Recharts heatmaps.
- **Avg. Holding Time**: Track how long you stay in trades across CNC and MIS products to refine your strategy.

### � Alpha Leaderboards

- **Global Rankings**: Compare your ROI against every other trader on the net worth growth leaderboard.
- **Badges of Honor**: Earn titles like "The Wizard" (50%+ ROI) or "Scalping Specialist" (50+ trades) based on your performance.
- **Competitive Edge**: Real-time rank updates as balance and portfolio values fluctuate.

### 📈 Interactive Chart Drawing Tools

- **Professional Analysis**: Add trendlines, horizontal support/resistance levels, and Fibonacci retracement directly on the canvas.
- **Scale Invariant**: Drawings remain perfectly aligned with price action during real-time zoom and pan operations.
- **Quick Controls**: Specialized toolbar for switching tools or clearing all analysis with one click.

---

## �🎯 Core Features

### 🧠 AI & Quant Suite

| Feature                       | Description                                                                 | Status |
| ----------------------------- | --------------------------------------------------------------------------- | ------ |
| **EMA Crossover (9/21)**      | Generates BUY/SELL signals on 9-period/21-period moving average crossovers. | ✅     |
| **RSI Mean Reversion**        | Identifies overbought (>70) and oversold (<30) market conditions.           | ✅     |
| **Floating Signal Feed**      | Premium top-middle overlay for real-time AI signal broadcasts.              | ✅     |
| **Persistent Signal History** | Historical signals saved to DB and available on load.                       | ✅ NEW |
| **One-Click Copy Trading**    | Instantly auto-fills order panels based on AI signals.                      | ✅     |
| **Quant Backtester**          | Analyze the last 24h performance of any stock locally.                      | ✅     |
| **Custom Algo Architect**     | Tune EMA periods and risk parameters directly from your profile.            | ✅     |

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
