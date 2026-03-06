# 📈 Zerodha Clone — Full-Stack Virtual Trading Platform

A professional-grade virtual trading platform built with **React + Vite** (frontend) and **Node.js + Express** (backend), featuring real-time price simulation, advanced order types, a live candlestick chart, financial calculators, and a stunning dark-first UI.

> 💡 Users start with **₹1,00,000** in virtual capital and can trade 20 real NSE stocks with zero real money risk.

---

## ✨ What's New (Advanced Premium Trading Features)

### 📈 Technical Indicators (SMA/EMA) on Canvas Engine

- **Mathematical overlays:** Dynamically calculates and renders **50-SMA (Orange Line)** and **20-EMA (Blue Line)** directly onto our custom `<canvas>` context window.
- **Interactive Toggles:** Added an robust "Indicators" toggle next to the timeframe selection that mathematically slices and recalculates the visible panning boundary natively on the client using the underlying OHLC `candles` state array seamlessly with the native 30-sec updates.
- **Full-Screen Support:** Fully works in full-screen charting modes too.

### ⚡ Live Option Chain (F&O Matrix)

- **Zero-Backend Option Chain:** Created a brand new `<OptionChain />` engine entirely rendered on the frontend to avoid hammering backend servers.
- **Dynamic Strikes:** Generates NIFTY strikes with standard 50-point jumps rounded up from the simulated index average.
- **Black-Scholes Options Engine:** Embedded a pure Javascript translation of the Black-Scholes formula in the table to dynamically calculate **Delta, Gamma, Theta, and Premium Options LTP** on the fly.
- **Interactive IV / DTE:** Features interactive inputs to let you simulate "Days to Expiry (DTE)" and control the "Implied Volatility (IV)" slider, live updating the Option premiums instantly!

### 🔔 Server-Side Price Alerts Engine

- **Background Matching:** Built an asynchronous background engine (`alertEngine.js`) running on a 2-second interval, checking `ABOVE` and `BELOW` conditions.
- **WebSockets Push:** Once a condition is hit, it automatically triggers a WebSockets payload to securely push notifications directly to the existing UI Notification Bell!
- **Alerts Panel:** Built a new `AlertsPanel.jsx` strictly for `Dashboard.jsx`. You can select a stock, pick condition (Above/Below), enter target price, and track your active, triggered lists smoothly.

### 🛡️ Bracket Orders & Stop-Loss UI

- **Bracket Order mode** added to the Buy/Sell Panel — toggle "Enable Bracket (SL + Target)" on any BUY
- Enter **Entry Price**, **Stop-Loss Price**, and **Target Price** in a dedicated risk panel

- Live **Max Loss** and **Max Gain** calculations shown before you place the order
- Orders sent to the backend with all 3 legs; engine auto-spawns child SL+Target sell orders upon entry fill

### ⚡ CNC vs MIS Product Types (Delivery vs Intraday)

- Every order is now tagged as:
  - 🏦 **CNC** — Carry & Deliver (long-term holdings)
  - ⚡ **MIS** — Margin Intraday Square-off (intraday positions, auto square-off at 3:20 PM)
- Toggle cleanly visible in the Buy/Sell panel above the order type

### 📊 Portfolio Page — Holdings + Positions Tabs

- The `/holdings` page is now a **Portfolio hub** with two tabs:
  - **Holdings tab** — Shows CNC long-term stocks with full P&L, allocation bar, and totals
  - **Positions tab** — Shows today's MIS intraday trades only, with amber "MIS" badge and auto square-off warning

### ⚙️ Enhanced Order Matching Engine

- Bracket entry fill → **automatically spawns** Stop-Loss + Target child orders
- When Target is hit → **sibling SL order is auto-cancelled** (One Cancels Other / OCO)
- All holdings keyed by `productType + tradeDate` to prevent MIS bleeding into CNC holdings

### 🌐 Routing & Navigation Fixes

- **Landing Page** (`/`) publicly accessible
- **Unauthenticated** users bounced back to Landing page, not login
- **Logout** redirects to Landing page
- `PublicRoute` on `/login` — logged in users go to `/dashboard`

### 🎨 Theme & UI

- Pure **True Dark Black** theme (`#000000` background, `#0a0a0a` cards)
- **Vibrant Purple** accent (`#7c3aed`)
- Calculators accessible from the Navbar and embedded in the Landing page
- Stock chart state preserved across stock switches (no snap-back)
- Nested `<button>` hydration error in Chart dropdown resolved

---

## 🎯 Full Feature List

### Trading System

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| Market Orders (instant execution)          | ✅     |
| Limit Orders (pending engine)              | ✅     |
| **CNC / MIS product type per order**       | ✅ NEW |
| Stop-Loss Orders (trigger price auto-sell) | ✅     |
| **Bracket Orders (Entry + SL + Target)**   | ✅ NEW |
| **OCO — Target fill auto-cancels SL leg**  | ✅ NEW |
| Short Selling                              | ✅     |
| Order Cancellation + Auto Refund           | ✅     |
| Background Matching Engine (2s interval)   | ✅     |
| Live P&L across all panels                 | ✅     |

### Portfolio Management

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| **Holdings tab (CNC long-term only)**      | ✅ NEW |
| **Positions tab (MIS intraday only)**      | ✅ NEW |
| Real-time P&L with live prices via Socket  | ✅     |
| Portfolio allocation bar chart             | ✅     |
| Sort by P&L, invested, quantity            | ✅     |
| Click row → navigate to stock on Dashboard | ✅     |

### Dashboard

| Feature                                    | Status   |
| ------------------------------------------ | -------- |
| Canvas candlestick chart with zoom/pan     | ✅       |
| Live stock ticker + order book             | ✅       |
| **Technical Indicators (SMA/EMA)**         | ✅ NEW   |
| AI Prediction card                         | ✅       |
| Active orders with cancel button           | ✅       |
| **Server-Side Price Alerts Panel UI**      | ✅ NEW   |
| **Chart state preserved on stock switch**  | ✅ FIXED |
| **Bracket Order panel + SL/Target inputs** | ✅ NEW   |
| **Max Loss / Max Gain estimator**          | ✅ NEW   |

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

| Page                             | Description                                                   |
| -------------------------------- | ------------------------------------------------------------- |
| **Landing** (`/`)                | Marketing hero page, calculator preview, dashboard screenshot |
| **Login/Signup** (`/login`)      | Auth forms                                                    |
| **Dashboard** (`/dashboard`)     | Full trading terminal                                         |
| **Portfolio** (`/holdings`)      | Holdings + Positions tabs                                     |
| **Market** (`/market`)           | All stocks, Sector filters, **Live Option Chain (New)**       |
| **Orders** (`/orders`)           | Full order history                                            |
| **Watchlist** (`/watchlist`)     | Saved stocks                                                  |
| **Funds** (`/funds`)             | Deposit / Withdraw / Net Worth                                |
| **Calculators** (`/calculators`) | All 10 financial tools                                        |
| **Profile** (`/profile`)         | Name, password, avatar                                        |

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
