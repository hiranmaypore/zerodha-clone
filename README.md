# 📈 Zerodha Clone — Full-Stack Virtual Trading Platform

A professional-grade virtual trading platform built with **React + Vite** (frontend) and **Node.js + Express** (backend), featuring real-time price simulation, advanced order types, a live candlestick chart, financial calculators, and a stunning dark-first UI.

> 💡 Users start with **₹1,00,000** in virtual capital and can trade 20 real NSE stocks with zero real money risk.

---

## ✨ What's New (Advanced AI & Quant Trading)

### 🤖 AlgoBot — Quantitative Trading Engine

- **Dual-Strategy Core:** A high-performance background engine running two concurrent quantitative strategies:
  - **EMA Crossover (9/21):** Detects momentum shifts using the 9-period Fast and 21-period Slow Exponential Moving Averages.
  - **RSI Mean Reversion:** Identifies "Oversold" (<30) and "Overbought" (>70) conditions using the 14-period Relative Strength Index.
- 📊 **Portfolio Equity Curve**: Visualize your net worth growth over time with interactive charts.
- 🔥 **Market Heatmap**: Real-time sector analysis to identify industrial rotations and momentum.
- ⚙️ **Custom Algo Architect**: Tune EMA periods and risk parameters (SL/Target) for your bot.
- 🏆 **Trader Ranks & Milestones**: Gamified progress system tracking your career profits.
- 🚀 **One-Click Copy Trading**: Execute AI signals instantly with pre-filled orders.
- **Top-Middle Live Feed:** New signals are broadcasted via WebSockets and displayed in a premium, top-center floating overlay with strategy-specific "BUY" and "SELL" badges.

### ⚡ One-Click Copy Trading

- **Instant Execution:** Every AI signal features a "COPY TRADE" button.
- **Auto-Fill Logic:** Clicking it instantly pre-fills the Buy/Sell Panel with the correct ticker, side (Buy/Sell), current price as a Limit, and calculates a 10% portfolio exposure quantity automatically.

### 📊 Local Quant Backtesting Module

- **Historical Performance:** Added a brand new `BacktestPanel` that analyzes the last 24 hours of 1-minute tick data locally.
- **Instant ROI:** Calculates Total Trades, Win Rate, and Net P&L (₹) for any stock before you commit capital to an AI strategy.

### 🔔 Contextual AI Preferences

- **Strategy Filtering:** Choose to see All signals, or filter strictly for EMA or RSI strategies in your Profile settings.
- **Desktop Push Notifications:** Integrated browser-level `Notification API` alerts so you never miss a crossover while multi-tasking.

---

## 🎯 Full Feature List

### AI & Quant Suite

| Feature                                   | Status |
| ----------------------------------------- | ------ |
| **EMA Crossover (9/21) Engine**           | ✅ NEW |
| **RSI Overbought/Oversold Engine**        | ✅ NEW |
| **Top-Middle Live Signal Feed**           | ✅ NEW |
| **One-Click Copy Trading (Auto-Fill)**    | ✅ NEW |
| **Historical Quant Backtester**           | ✅ NEW |
| **Browser Push Notifications**            | ✅ NEW |
| **Strategy Filtering (Profile Settings)** | ✅ NEW |

### Trading System

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| Market Orders (instant execution)          | ✅     |
| Limit Orders (pending engine)              | ✅     |
| **CNC / MIS product type per order**       | ✅     |
| Stop-Loss Orders (trigger price auto-sell) | ✅     |
| **Bracket Orders (Entry + SL + Target)**   | ✅     |
| **OCO — Target fill auto-cancels SL leg**  | ✅     |
| Short Selling                              | ✅     |
| Order Cancellation + Auto Refund           | ✅     |
| Background Matching Engine (2s interval)   | ✅     |
| Live P&L across all panels                 | ✅     |

### Portfolio Management

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| **Holdings tab (CNC long-term only)**      | ✅     |
| **Positions tab (MIS intraday only)**      | ✅     |
| Real-time P&L with live prices via Socket  | ✅     |
| Portfolio allocation bar chart             | ✅     |
| Sort by P&L, invested, quantity            | ✅     |
| Click row → navigate to stock on Dashboard | ✅     |

### Dashboard

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| Canvas candlestick chart with zoom/pan     | ✅     |
| Live stock ticker + order book             | ✅     |
| **Technical Indicators (SMA/EMA)**         | ✅     |
| **Global AlgoBot Signal Feed**             | ✅ NEW |
| **One-Click Copy Trade System**            | ✅ NEW |
| **Backtesting Simulation Module**          | ✅ NEW |
| Active orders with cancel button           | ✅     |
| **Server-Side Price Alerts Panel UI**      | ✅     |
| **Chart state preserved on stock switch**  | ✅     |
| **Bracket Order panel + SL/Target inputs** | ✅     |
| **Max Loss / Max Gain estimator**          | ✅     |

### Financial Calculators (10 Tools)

| Calculator    | Description                                  |
| ------------- | -------------------------------------------- |
| SIP           | Systematic Investment Plan returns           |
| Step-Up SIP   | SIP with annual step-up percentage           |
| EMI           | Loan EMI breakdown                           |
| SWP           | Systematic Withdrawal Plan                   |
| Retirement    | Corpus requirement planner                   |
| NPS           | National Pension Scheme estimator            |
| STP           | Systematic Transfer Plan                     |
| Brokerage     | Zerodha's exact fee structure                |
| F&O Margin    | Futures & Options margin calculator          |
| Black-Scholes | Option pricing with Delta/Gamma/Theta Greeks |

### Pages

| Page                             | Description                                                               |
| -------------------------------- | ------------------------------------------------------------------------- |
| **Landing** (`/`)                | Marketing hero page, calculator preview, dashboard screenshot             |
| **Login/Signup** (`/login`)      | Auth forms                                                                |
| **Dashboard** (`/dashboard`)     | Full trading terminal + **AlgoBot Signals** + **Backtest Module**         |
| **Portfolio** (`/holdings`)      | Holdings + Positions tabs                                                 |
| **Market** (`/market`)           | All stocks, Sector filters, **Live Option Chain (New)**                   |
| **Orders** (`/orders`)           | Full order history                                                        |
| **Watchlist** (`/watchlist`)     | Saved stocks                                                              |
| **Funds** (`/funds`)             | Deposit / Withdraw / Net Worth                                            |
| **Calculators** (`/calculators`) | All 10 financial tools                                                    |
| **Profile** (`/profile`)         | Account settings + **Algo Strategy Selection** + **Notification Toggles** |

---

## 🛠️ Tech Stack

### Frontend

| Category    | Technology                                  |
| ----------- | ------------------------------------------- |
| Framework   | React 18 + Vite 7                           |
| Routing     | React Router DOM v7                         |
| Styling     | Tailwind CSS v4 (custom dark design tokens) |
| Charts      | Custom Canvas-based candlestick renderer    |
| Real-time   | Socket.IO Client                            |
| HTTP Client | Axios                                       |
| Icons       | Lucide React                                |
| Fonts       | Inter (Google Fonts)                        |

### Backend

| Category   | Technology                                    |
| ---------- | --------------------------------------------- |
| Runtime    | Node.js                                       |
| Framework  | Express.js 4.x                                |
| Database   | MongoDB + Mongoose                            |
| Auth       | JWT + bcryptjs                                |
| Real-time  | Socket.IO                                     |
| Price Data | Alpha Vantage API (with random-walk fallback) |

---

## 📦 Installation

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas URI)
- Alpha Vantage API key (optional — random-walk fallback will be used if absent)

### 1. Clone & Install

```bash
# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### 2. Environment Variables

**`backend/.env`**

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zerodha_clone
JWT_SECRET=your_super_secret_key_here
ALPHA_VANTAGE_KEY=your_api_key_optional
FRONTEND_URL=http://localhost:5173
```

**`frontend/.env`** (optional, for production)

```env
VITE_API_URL=http://localhost:5000
```

### 3. Run in Development

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → Server on http://localhost:5000

# Terminal 2 — Frontend
cd frontend
npm run dev
# → App on http://localhost:5173
```

### 4. Verify Backend Startup

```
🔔 Order Notifications Service Initialized
📊 Price History Service Started...
⚙️  Matching Engine Started (DB mode)...
MongoDB Connected 😛
Server running on port 5000
```

---

## 📡 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint            | Auth | Description                              |
| ------ | ------------------- | ---- | ---------------------------------------- |
| POST   | `/api/auth/signup`  | ❌   | Register (starts with ₹1,00,000 balance) |
| POST   | `/api/auth/login`   | ❌   | Login & receive JWT                      |
| GET    | `/api/auth/profile` | ✅   | Get user profile                         |
| PUT    | `/api/auth/profile` | ✅   | Update name / change password            |

### Orders (`/api/orders`)

| Method | Endpoint                | Auth | Description                         |
| ------ | ----------------------- | ---- | ----------------------------------- |
| POST   | `/api/orders/buy`       | ✅   | Market or Limit BUY (CNC or MIS)    |
| POST   | `/api/orders/sell`      | ✅   | Market or Limit SELL                |
| POST   | `/api/orders/stop-loss` | ✅   | Place a Stop-Loss trigger           |
| POST   | `/api/orders/bracket`   | ✅   | Place Bracket (entry + SL + target) |
| GET    | `/api/orders`           | ✅   | All orders for user                 |
| DELETE | `/api/orders/:id`       | ✅   | Cancel a PENDING order              |

#### Example — Bracket Order

```http
POST /api/orders/bracket
Authorization: Bearer <token>

{
  "stockSymbol": "INFY",
  "quantity": 5,
  "entryPrice": 1800,
  "targetPrice": 1900,
  "stopLossPrice": 1750,
  "productType": "MIS"
}
```

#### Example — MIS Market Buy

```http
POST /api/orders/buy

{
  "stockSymbol": "TCS",
  "quantity": 10,
  "orderType": "MARKET",
  "productType": "MIS"
}
```

### Portfolio (`/api/holdings`)

| Method | Endpoint                  | Auth | Description                              |
| ------ | ------------------------- | ---- | ---------------------------------------- |
| GET    | `/api/holdings`           | ✅   | CNC long-term holdings only              |
| GET    | `/api/holdings/positions` | ✅   | **NEW** — Today's MIS intraday positions |
| GET    | `/api/holdings/dashboard` | ✅   | Full portfolio summary                   |

#### Positions Response (New)

```json
{
  "success": true,
  "count": 2,
  "positions": [
    {
      "stock": "TCS",
      "name": "Tata Consultancy Services",
      "quantity": 5,
      "avgPrice": 3500.0,
      "currentPrice": 3520.5,
      "pnl": 102.5,
      "pnlPercent": 0.59
    }
  ]
}
```

### Funds (`/api/funds`)

| Method | Endpoint              | Auth | Description          |
| ------ | --------------------- | ---- | -------------------- |
| GET    | `/api/funds`          | ✅   | Current cash balance |
| POST   | `/api/funds/deposit`  | ✅   | Add virtual funds    |
| POST   | `/api/funds/withdraw` | ✅   | Withdraw funds       |

### Prices (`/api/prices`)

| Method | Endpoint                      | Auth | Description          |
| ------ | ----------------------------- | ---- | -------------------- |
| GET    | `/api/prices/:symbol`         | ❌   | Current live price   |
| GET    | `/api/prices/history/:symbol` | ❌   | Historical OHLC bars |

#### History Query Parameters

| Param    | Type                     | Description                                                  |
| -------- | ------------------------ | ------------------------------------------------------------ |
| `period` | `1h` `6h` `1d` `1w` `1m` | **Preferred** — automatically sets `from`, `to`, and `limit` |
| `from`   | ISO date string          | Start date override (only used when `period` is absent)      |
| `to`     | ISO date string          | End date override (only used when `period` is absent)        |
| `limit`  | integer 1–1000           | Bar count override (default 100)                             |

> **Period → Window mapping**
>
> | Period | Lookback   | Bars returned     |
> | ------ | ---------- | ----------------- |
> | `1h`   | 60 minutes | 60 (1-min bars)   |
> | `6h`   | 6 hours    | 72 (5-min bars)   |
> | `1d`   | 24 hours   | 96 (15-min bars)  |
> | `1w`   | 7 days     | 168 (hourly bars) |
> | `1m`   | 30 days    | 200 (daily bars)  |

**Examples:**

```http
GET /api/prices/history/TCS?period=1d
GET /api/prices/history/INFY?from=2026-03-01&to=2026-03-06&limit=50
```

---

## 🔌 WebSocket Events

Connect to `ws://localhost:5000`

```javascript
// Live price stream
socket.on("price_update", (prices) => {
  // { TCS: 3500.20, INFY: 1450.30, ... }
});

// Join your private notification room
socket.emit("join_user_room", userId);

// Order alerts
socket.on("order_executed",       (data) => { ... });
socket.on("order_cancelled",      (data) => { ... });
socket.on("stop_loss_triggered",  (data) => { ... });
socket.on("bracket_entry_executed",(data) => { ... });
```

---

## 🏗️ Project Structure

```
zerodha-clone/
├── backend/
│   └── src/
│       ├── calculators/          # 10 financial calculators
│       │   ├── investment/       #   SIP, SWP, EMI, NPS, STP, Retirement
│       │   ├── brokerage/        #   Brokerage, F&O Margin, Black-Scholes
│       │   └── utils/            #   Formulas & validators
│       ├── config/
│       │   ├── db.js             # MongoDB connection
│       │   └── stocks.js         # 20 NSE stock definitions
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── orderController.js         # Buy/sell/cancel + productType
│       │   ├── advancedOrderController.js # Stop-Loss & Bracket
│       │   ├── portfolioController.js     # Holdings + NEW Positions
│       │   ├── fundsController.js
│       │   ├── watchlistController.js
│       │   ├── priceController.js
│       │   └── stockController.js
│       ├── models/
│       │   ├── User.js           # User + balance
│       │   ├── Order.js          # + productType (CNC/MIS) field
│       │   ├── Holding.js        # + productType + tradeDate fields
│       │   ├── Watchlist.js
│       │   └── PriceHistory.js
│       ├── routes/
│       │   ├── portfolioRoutes.js  # NEW: GET /positions route
│       │   └── ...
│       ├── services/
│       │   ├── matchingEngine.js   # UPGRADED: Bracket OCO + CNC/MIS keying
│       │   ├── priceFetcher.js     # Alpha Vantage + fallback
│       │   ├── priceSimulator.js   # Random walk engine
│       │   ├── priceHistoryService.js
│       │   └── orderNotifications.js
│       └── server.js
│
└── frontend/
    └── src/
        ├── components/
        │   ├── dashboard/
        │   │   ├── BuySellPanel.jsx     # UPGRADED: CNC/MIS + Bracket mode
        │   │   ├── ChartPanel.jsx       # FIXED: no snap-back on stock switch
        │   │   ├── ActiveOrders.jsx
        │   │   ├── OrderBook.jsx
        │   │   ├── AIPredictionCard.jsx
        │   │   └── PortfolioSummary.jsx
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx              # Logout → Landing page
        │   ├── StockIcon.jsx
        │   └── Toast.jsx
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useWatchlist.js
        ├── pages/
        │   ├── Landing.jsx              # Premium landing page
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── Holdings.jsx             # UPGRADED: Holdings + Positions tabs
        │   ├── Market.jsx
        │   ├── Orders.jsx
        │   ├── Watchlist.jsx
        │   ├── Funds.jsx
        │   ├── Calculators.jsx
        │   └── Profile.jsx
        ├── services/
        │   ├── api.js                   # + getPositions()
        │   └── socket.js
        ├── App.jsx                      # FIXED: ProtectedRoute → /
        └── index.css                    # True Dark Black design tokens
```

---

## ⚙️ Matching Engine — How It Works

The engine runs every **2 seconds** in the background:

| Trigger                 | Condition                | Action                                     |
| ----------------------- | ------------------------ | ------------------------------------------ |
| Regular LIMIT BUY       | `price <= limitPrice`    | Fill order, add to CNC/MIS holding         |
| Regular LIMIT SELL      | `price >= limitPrice`    | Fill order, credit balance                 |
| Stop-Loss SELL          | `price <= stopLossPrice` | Market sell, credit balance                |
| **Bracket BUY entry**   | `price <= limitPrice`    | Fill, spawn SL child + Target child orders |
| **Bracket Target fill** | `price >= targetPrice`   | Fill, **cancel sibling SL** (OCO)          |

---

## 🎨 Design System

All colors are defined as CSS custom properties via Tailwind v4 `@theme`:

| Token             | Value     | Usage                     |
| ----------------- | --------- | ------------------------- |
| `--color-dark`    | `#000000` | Page background           |
| `--color-card`    | `#0a0a0a` | Card backgrounds          |
| `--color-surface` | `#171717` | Input fields, panels      |
| `--color-accent`  | `#7c3aed` | Buttons, active states    |
| `--color-profit`  | `#26a641` | Green P&L, BUY button     |
| `--color-loss`    | `#f85149` | Red P&L, SELL button      |
| `--color-warning` | `#d29922` | MIS badge, caution states |

---

## 🐛 Known Issues & Fixes Applied

| Issue                                                        | Fix                                                 |
| ------------------------------------------------------------ | --------------------------------------------------- |
| Nested `<button>` in chart stock dropdown (hydration error)  | Outer element changed to `<div>`                    |
| Chart pan/zoom reset on stock switch                         | Removed `panOffsetRef.current = 0` on stock fetch   |
| Logout redirecting to `/login` instead of `/`                | Fixed `handleLogout` + `ProtectedRoute` fallback    |
| Calculator inputs returning success message instead of value | Updated API response parsing to use `res.data.data` |
| Public landing page blocked by ProtectedRoute                | Separated `PublicRoute` and made `/` open           |

---

## 🚀 Deployment

### Backend (Render / Railway)

```env
PORT=5000
MONGO_URI=<your_atlas_uri>
JWT_SECRET=<random_256bit_secret>
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (Vercel / Netlify)

```env
VITE_API_URL=https://your-backend.onrender.com
```

Update `frontend/vite.config.js` proxy target to your deployed backend URL for production.

---

## 📈 Available Stocks (20 NSE Symbols)

`TCS` · `INFY` · `RELIANCE` · `HDFC` · `ICICI` · `SBIN` · `BHARTIARTL` · `HCLTECH` · `ITC` · `KOTAKBANK` · `LT` · `AXISBANK` · `WIPRO` · `BAJFINANCE` · `MARUTI` · `TITAN` · `SUNPHARMA` · `TATAMOTORS` · `ASIANPAINT` · `ULTRACEMCO`

---

## 🔒 Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- JWT tokens expire in **30 days**
- All sensitive routes protected by `authMiddleware`
- CORS restricted to `FRONTEND_URL`
- Funds operations validated server-side (cannot withdraw more than balance)
- Calculator endpoints are **stateless** — no user data persisted

---

## 📖 License

This is an educational project built for learning full-stack development. Not affiliated with Zerodha.

---

**Happy Trading! 📈**
