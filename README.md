# 📈 Zerodha Clone — Full-Stack Virtual Trading Platform

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright&logoColor=white)](https://playwright.dev/)
[![License](https://img.shields.io/badge/License-Educational-blue)](#)

A **production-grade virtual trading platform** built with the MERN stack. Features real-time price simulation, AI-powered trading signals, institutional-grade portfolio analytics, and a stunning dark/light theme system — all backed by 20 real NSE stocks.

> 💡 **Start Instantly**: New users get **₹1,00,000** in virtual capital. No MongoDB required — runs in Demo Mode with in-memory storage.

---

## ✨ Feature Highlights

### 🖥️ Trading Dashboard
- **Live Candlestick Chart** — Custom canvas-based chart with zoom, pan, SMA/EMA overlays, and drawing tools (trendlines, Fibonacci)
- **Real-Time Order Book** — Simulated bid/ask depth for all 20 stocks
- **One-Click Trading** — Market, Limit, Stop-Loss, Bracket, and GTT orders
- **AI Insights Panel** — Live sentiment analysis with confidence scores, targets, and stop-loss

### 🤖 Algo Lab & AI Suite
- **EMA Crossover (9/21)** — Automated BUY/SELL signals on moving average crossovers
- **RSI Mean Reversion** — Identifies overbought (>70) and oversold (<30) conditions
- **Historical Backtesting** — Stress-test strategies over historical data with equity curve projections
- **One-Click Copy Trading** — Auto-fills order panels from AI signal broadcasts

### 📊 Portfolio & Analytics
- **Real P&L Tracking** — FIFO-matched BUY/SELL pairs with realized gains
- **Sharpe Ratio & Max Drawdown** — Institutional risk metrics
- **Sector Allocation** — Dynamic pie chart showing exposure across Banking, IT, Auto, Pharma
- **Equity Curve** — Track portfolio value over time with date range selector

### ⚡ Market Pulse
- **Volume Shockers** — Stocks traded >2x their 15-day average volume
- **RSI Screener** — Overbought/Oversold scanner with signal tags
- **Market Breadth** — Advance/Decline ratio with live sentiment gauge
- **Intelligence Hub** — AI-generated market news feed with search and filters

### 📔 Trade Journal
- **Win Rate & Streaks** — Real-time performance tracking from matched trades
- **Daily Profit Heatmap** — Recharts-powered day-of-week P&L visualization
- **Trade History Table** — Sortable, paginated table with entry/exit prices, P&L%, and hold time
- **Tax Statement Export** — One-click CSV download for tax filing

### 🏆 Social & Gamification
- **Global Leaderboard** — ROI-based rankings with weekly/monthly/all-time tabs
- **Achievement Badges** — The Wizard, Consistent Gainer, Diamond Hands, Whale, etc.
- **Community Feed** — Real-time social timeline of completed trades

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, Tailwind CSS v4, Recharts, Lightweight Charts |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, bcryptjs |
| **Database** | MongoDB + Mongoose (optional — runs in Demo Mode without it) |
| **Real-Time** | WebSocket price streaming, order notifications, algo signals |
| **Testing** | Playwright E2E (auto-starts both servers) |
| **Icons** | Lucide React |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org/))
- **MongoDB** (optional — app runs in Demo Mode without it)

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/zerodha-clone.git
cd zerodha-clone

# Install both backend and frontend
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=5000
MONGO_URI=mongodb+srv://your_uri    # Optional — omit for Demo Mode
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### 3. Run

```bash
# Terminal 1: Backend
cd backend
npm run dev    # Starts on port 5000

# Terminal 2: Frontend
cd frontend
npm run dev    # Starts on port 5173
```

Open **http://localhost:5173** — sign up and start trading!

### 4. Run E2E Tests

```bash
cd frontend
npm test       # Auto-starts both servers, runs 3 Playwright tests
```

---

## 📁 Project Structure

```
zerodha-clone/
├── backend/
│   ├── src/
│   │   ├── config/          # Stock metadata (20 NSE symbols)
│   │   ├── controllers/     # Auth, Orders, Holdings, Journal, Signals, Backtest
│   │   ├── middleware/      # JWT auth, rate limiter, input validation
│   │   ├── models/          # User, Order, Holding, Watchlist, Alert, Signal
│   │   ├── routes/          # RESTful API routes
│   │   ├── services/        # Price simulator, matching engine, algo bot
│   │   └── server.js        # Express + Socket.IO entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Layout, Sidebar, Skeleton, ErrorBoundary, OnboardingTour
│   │   │   ├── dashboard/   # ChartPanel, BuySellPanel, OrderBook, PortfolioSummary
│   │   │   └── market/      # OptionChain, SectorHeatmap, PayoffAnalyzer
│   │   ├── pages/           # 17 pages (Dashboard, Market, Orders, Holdings, etc.)
│   │   ├── services/        # Axios API client, Socket.IO connection
│   │   ├── context/         # AuthContext (JWT + user state)
│   │   └── hooks/           # useNotifications (browser push)
│   ├── tests/               # Playwright E2E tests
│   ├── playwright.config.js # Auto web server config
│   └── package.json
│
└── README.md
```

---

## 📈 Supported Stocks

20 major NSE symbols across 8 sectors:

| Sector | Stocks |
|--------|--------|
| **IT** | TCS, INFY, HCLTECH, WIPRO |
| **Banking** | HDFC, ICICI, SBIN, KOTAKBANK, AXISBANK |
| **Energy** | RELIANCE |
| **Telecom** | BHARTIARTL |
| **FMCG** | ITC |
| **Auto** | MARUTI, TATAMOTORS |
| **Infrastructure** | LT |
| **Consumer** | BAJFINANCE, TITAN, ASIANPAINT |
| **Pharma** | SUNPHARMA |
| **Cement** | ULTRACEMCO |

---

## 🔧 Backend Services

| Service | Description | Frequency |
|---------|-------------|-----------|
| **Price Simulator** | Random walk with mean reversion for realistic price movements | Every 2s |
| **Matching Engine** | FIFO order matching for limit orders against live prices | Every 2s |
| **Algo Bot** | EMA Crossover + RSI strategy signal generation | Every 30s |
| **Alert Engine** | Price alert monitoring and WebSocket notifications | Every 5s |
| **Auto Square-Off** | MIS (intraday) position closure at market close | Scheduled |
| **Equity Service** | Portfolio equity curve snapshots for charting | Every 5m |

---

## 🛡️ Security & Quality

- **Authentication**: JWT tokens with auto-logout on 401
- **Rate Limiting**: API (200/15min), Auth (15/15min), Orders (30/min)
- **Input Validation**: express-validator schemas on all API inputs
- **Error Boundary**: React error boundary with crash recovery UI
- **E2E Tests**: Playwright tests covering signup → order → portfolio flow

---

## 📄 API Endpoints

<details>
<summary>Click to expand full API reference</summary>

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login & get JWT |
| GET | `/api/auth/profile` | Get user profile |
| PUT | `/api/auth/profile` | Update preferences |

### Trading
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders/buy` | Place buy order |
| POST | `/api/orders/sell` | Place sell order |
| POST | `/api/orders/bracket` | Place bracket order |
| POST | `/api/orders/stop-loss` | Place stop-loss |
| GET | `/api/orders` | Get all orders |
| DELETE | `/api/orders/:id` | Cancel order |

### Portfolio
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holdings` | Get CNC holdings |
| GET | `/api/holdings/positions` | Get MIS positions |
| GET | `/api/holdings/journal` | Trade journal analytics |
| GET | `/api/holdings/analytics` | Portfolio analytics |
| GET | `/api/holdings/leaderboard` | Global rankings |
| GET | `/api/holdings/export` | Tax statement CSV |

### Market Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | All stocks with live prices |
| GET | `/api/stocks/:symbol/detail` | Stock fundamentals |
| GET | `/api/stocks/:symbol/sentiment` | AI sentiment |
| GET | `/api/prices/history/:symbol` | OHLCV candle data |

</details>

---

## 📖 License

Built for educational purposes as a demonstration of modern full-stack fintech development.

**Happy Trading! 📈**
