# Zerodha Clone - Full-Stack Trading Platform

A comprehensive Node.js + Express backend simulating a professional stock trading platform with real-time price updates, advanced order types, 10 financial calculators, and WebSocket notifications.

---

## 🎯 Features

### Trading System

- ✅ **Market Orders** - Instant execution at current price
- ✅ **Limit Orders** - Execute when price reaches target
- ✅ **Short Selling** - Sell stocks you don't own
- ✅ **Stop-Loss Orders** - Auto-sell when price drops to trigger level
- ✅ **Bracket Orders** - 3-legged orders (entry + target + stop-loss)
- ✅ **Order Cancellation** - Cancel pending orders with automatic refunds
- ✅ **Order Matching Engine** - Background service for pending orders (1s interval)
- ✅ **Portfolio Management** - Holdings with real-time P&L calculations
- ✅ **Watchlist** - Save up to 50 favorite stocks
- ✅ **Funds Management** - Deposit, withdraw, balance check

### Financial Calculators (10 Tools)

**Investment Planning:**

- SIP Calculator
- Step-up SIP Calculator
- EMI Calculator
- SWP (Systematic Withdrawal Plan)
- Retirement Planning Calculator
- NPS (National Pension Scheme)
- STP (Systematic Transfer Plan)

**Trading Tools:**

- Brokerage Calculator (Zerodha's fee structure)
- F&O Margin Calculator
- Black-Scholes Option Pricing (with Greeks)

### Real-time Features

- ✅ **Live Price Updates** - Socket.IO broadcasts every 1 second
- ✅ **Price Simulation** - Random walk algorithm (20 stocks)
- ✅ **Historical Price Data** - 60-second snapshots, 30-day retention
- ✅ **Order Notifications** - Real-time WebSocket alerts
- ✅ **Alpha Vantage Integration** - Real initial prices with fallback

### User & Portfolio

- ✅ **Dashboard** - Net worth, total P&L, recent orders summary
- ✅ **Holdings with P&L** - Current price, invested value, P&L %, per holding
- ✅ **Profile Management** - Update name, change password
- ✅ **Funds** - Deposit / withdraw with validation

### Security

- ✅ **JWT Authentication** - Secure token-based auth (30-day expiry)
- ✅ **Password Hashing** - bcrypt encryption (10 salt rounds)
- ✅ **Protected Routes** - Middleware authorization
- ✅ **CORS Enabled** - Cross-origin support

---

## 🛠️ Tech Stack

| Category       | Technology               |
| -------------- | ------------------------ |
| Runtime        | Node.js                  |
| Framework      | Express.js 4.21.2        |
| Database       | MongoDB + Mongoose 9.2.0 |
| Real-time      | Socket.IO                |
| Authentication | JWT + bcryptjs           |
| API Testing    | Axios                    |

---

## 📦 Installation

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Alpha Vantage API key (optional)

### Setup Steps

1. **Clone & Install**

```bash
cd backend
npm install
```

2. **Environment Variables**
   Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/zerodha_clone
JWT_SECRET=your_super_secret_key_here
ALPHA_VANTAGE_KEY=your_api_key_optional
FRONTEND_URL=http://localhost:5173
```

3. **Start Server**

```bash
# Development with auto-restart
npm run dev

# Production
npm start
```

4. **Verify**

```
🔔 Order Notifications Service Initialized
MongoDB Connected 😛
📊 Price History Service Started...
Matching Engine Started...
Server running on port 5000
Routes loaded: /api/auth, /api/orders, /api/holdings, /api/prices
```

---

## 📡 API Endpoints (30+)

### Authentication (`/api/auth`)

| Method | Endpoint            | Auth | Description                            |
| ------ | ------------------- | ---- | -------------------------------------- |
| POST   | `/api/auth/signup`  | ❌   | Create account (starts with ₹1,00,000) |
| POST   | `/api/auth/login`   | ❌   | Login & get JWT token                  |
| GET    | `/api/auth/profile` | ✅   | Get user profile                       |
| PUT    | `/api/auth/profile` | ✅   | Update name / password                 |

#### Signup

```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer <token>

{
  "name": "New Name",
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

---

### Stocks (`/api/stocks`)

| Method | Endpoint      | Auth | Description                            |
| ------ | ------------- | ---- | -------------------------------------- |
| GET    | `/api/stocks` | ❌   | List all 20 stocks with current prices |

**Available Stocks:** TCS, INFY, RELIANCE, HDFC, ICICI, SBIN, BHARTIARTL, HCLTECH, ITC, KOTAKBANK, LT, AXISBANK, WIPRO, BAJFINANCE, MARUTI, TITAN, SUNPHARMA, TATAMOTORS, ASIANPAINT, ULTRACEMCO

---

### Trading (`/api/orders`)

| Method | Endpoint                | Auth | Description           |
| ------ | ----------------------- | ---- | --------------------- |
| POST   | `/api/orders/buy`       | ✅   | Market or limit buy   |
| POST   | `/api/orders/sell`      | ✅   | Market or limit sell  |
| POST   | `/api/orders/stop-loss` | ✅   | Place stop-loss order |
| POST   | `/api/orders/bracket`   | ✅   | Place bracket order   |
| GET    | `/api/orders`           | ✅   | Get all user orders   |
| DELETE | `/api/orders/:orderId`  | ✅   | Cancel pending order  |

#### Market Buy

```http
POST /api/orders/buy
Authorization: Bearer <token>

{ "stockSymbol": "TCS", "quantity": 10, "orderType": "MARKET" }
```

#### Stop-Loss Order

```http
POST /api/orders/stop-loss

{ "stockSymbol": "TCS", "quantity": 5, "triggerPrice": 3400 }
```

#### Bracket Order

```http
POST /api/orders/bracket

{
  "stockSymbol": "INFY",
  "quantity": 5,
  "entryPrice": 1800,
  "targetPrice": 1900,
  "stopLossPrice": 1750
}
```

**Order Statuses:** `COMPLETED` | `PENDING` | `FAILED` | `CANCELLED`

**Order Categories:** `REGULAR` | `STOPLOSS` | `BRACKET`

---

### Portfolio (`/api/holdings`)

| Method | Endpoint                  | Auth | Description                 |
| ------ | ------------------------- | ---- | --------------------------- |
| GET    | `/api/holdings`           | ✅   | Holdings with P&L per stock |
| GET    | `/api/holdings/dashboard` | ✅   | Full portfolio dashboard    |

#### Holdings Response (with P&L)

```json
{
  "success": true,
  "count": 2,
  "holdings": [
    {
      "stock": "TCS",
      "name": "Tata Consultancy Services",
      "quantity": 10,
      "avgPrice": 3500.0,
      "currentPrice": 3620.5,
      "investedValue": 35000.0,
      "currentValue": 36205.0,
      "pnl": 1205.0,
      "pnlPercent": 3.44,
      "isShort": false
    }
  ]
}
```

#### Dashboard Response

```json
{
  "dashboard": {
    "user": { "name": "John", "email": "...", "balance": 65000.00 },
    "portfolio": {
      "totalInvested": 35000.00,
      "currentValue": 36205.00,
      "totalPnl": 1205.00,
      "totalPnlPercent": 3.44,
      "holdingsCount": 2
    },
    "netWorth": 101205.00,
    "recentOrders": [...]
  }
}
```

---

### Watchlist (`/api/watchlist`)

| Method | Endpoint                 | Auth | Description                    |
| ------ | ------------------------ | ---- | ------------------------------ |
| GET    | `/api/watchlist`         | ✅   | Get watchlist with live prices |
| POST   | `/api/watchlist`         | ✅   | Add stock (max 50)             |
| DELETE | `/api/watchlist/:symbol` | ✅   | Remove stock                   |

---

### Funds (`/api/funds`)

| Method | Endpoint              | Auth | Description              |
| ------ | --------------------- | ---- | ------------------------ |
| GET    | `/api/funds`          | ✅   | Check balance            |
| POST   | `/api/funds/deposit`  | ✅   | Deposit funds (max ₹1Cr) |
| POST   | `/api/funds/withdraw` | ✅   | Withdraw funds           |

---

### Price Data (`/api/prices`)

| Method | Endpoint                      | Auth | Description               |
| ------ | ----------------------------- | ---- | ------------------------- |
| GET    | `/api/prices/:symbol`         | ❌   | Current price for a stock |
| GET    | `/api/prices/history/:symbol` | ❌   | Historical price data     |

Query params for history: `?period=1h|6h|1d|1w|1m`

---

### Calculators (`/api/calculators`)

All calculators are **stateless** — no data stored in database.

| Endpoint                              | Description                |
| ------------------------------------- | -------------------------- |
| POST `/api/calculators/sip`           | SIP returns calculator     |
| POST `/api/calculators/step-up-sip`   | Step-up SIP calculator     |
| POST `/api/calculators/emi`           | EMI calculator             |
| POST `/api/calculators/swp`           | Systematic Withdrawal Plan |
| POST `/api/calculators/retirement`    | Retirement planning        |
| POST `/api/calculators/nps`           | National Pension Scheme    |
| POST `/api/calculators/stp`           | Systematic Transfer Plan   |
| POST `/api/calculators/brokerage`     | Brokerage & charges        |
| POST `/api/calculators/fo-margin`     | F&O margin calculator      |
| POST `/api/calculators/black-scholes` | Option pricing + Greeks    |

---

## 🔌 Real-time WebSocket

Connect to: `ws://localhost:5000`

### Price Updates

```javascript
socket.on("price_update", (prices) => {
  // { TCS: 3500.20, INFY: 1450.30, SBIN: 620.10, ... }
});
```

### Order Notifications

```javascript
// Join user room for private notifications
socket.emit("join_user_room", userId);

// Listen for events
socket.on("order_executed", (data) => {
  // { orderId, stock, type, quantity, price, timestamp }
});

socket.on("order_cancelled", (data) => {
  // { orderId, stock, cancelReason, timestamp }
});

socket.on("stop_loss_triggered", (data) => {
  // { orderId, stock, triggerPrice, executedPrice, timestamp }
});

socket.on("bracket_entry_executed", (data) => {
  // { orderId, stock, entryPrice, targetPrice, stopLossPrice, timestamp }
});
```

---

## 🧪 Testing

```bash
# Trading & orders
node test_api.js

# Order cancellation (4 tests)
node test_order_cancel.js

# Watchlist system (7 tests)
node test_watchlist.js

# Historical prices (6 tests)
node test_price_history.js

# Advanced orders - stop-loss & bracket (5 tests)
node test_advanced_orders.js

# Backend gaps - funds, P&L, dashboard, stocks, profile (6 tests)
node test_backend_gaps.js

# Calculators
node test_calculators.js
node test_phase2_calculators.js
node test_phase3_calculators.js
```

**Total: 40+ automated tests**

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── calculators/
│   │   ├── investment/         # 7 investment calculators
│   │   ├── brokerage/          # 3 trading calculators
│   │   └── utils/              # Formulas & validators
│   ├── config/
│   │   ├── db.js               # MongoDB connection
│   │   └── stocks.js           # 20 stock symbols
│   ├── controllers/
│   │   ├── authController.js         # Auth + profile update
│   │   ├── orderController.js        # Buy/sell/cancel
│   │   ├── advancedOrderController.js # Stop-loss & bracket
│   │   ├── portfolioController.js    # Holdings P&L + dashboard
│   │   ├── watchlistController.js    # Watchlist CRUD
│   │   ├── priceController.js        # Price data API
│   │   ├── fundsController.js        # Deposit/withdraw
│   │   └── stockController.js        # List all stocks
│   ├── models/
│   │   ├── User.js             # User + balance
│   │   ├── Order.js            # All order types
│   │   ├── Holding.js          # Portfolio positions
│   │   ├── Watchlist.js        # Favorite stocks (max 50)
│   │   └── PriceHistory.js     # Historical snapshots
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── portfolioRoutes.js
│   │   ├── watchlistRoutes.js
│   │   ├── priceRoutes.js
│   │   ├── fundsRoutes.js
│   │   ├── stockRoutes.js
│   │   └── calculatorRoutes.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT protection
│   ├── services/
│   │   ├── priceFetcher.js         # Alpha Vantage API
│   │   ├── priceSimulator.js       # Random walk engine
│   │   ├── matchingEngine.js       # Order execution (SL/bracket)
│   │   ├── priceHistoryService.js  # 60s price snapshots
│   │   └── orderNotifications.js   # WebSocket alerts
│   ├── sockets/
│   │   └── priceSocket.js      # Live price broadcasts
│   ├── utils/
│   │   └── randomWalk.js
│   └── server.js               # Main entry point
├── test_*.js                    # Test scripts (40+ tests)
├── package.json
└── .env
```

---

## 🎮 Features in Detail

### Matching Engine

Background service runs every 1 second:

- **Regular Limit BUY**: Execute when `currentPrice <= limitPrice`
- **Regular Limit SELL**: Execute when `currentPrice >= limitPrice`
- **Stop-Loss**: Trigger when `currentPrice <= triggerPrice` → market sell
- **Bracket Entry**: Execute when `currentPrice <= entryPrice` → creates target + SL legs
- **Bracket Legs**: When one leg executes, the other is auto-cancelled

### Short Selling

- Sell stocks you don't own
- Holdings show negative quantity with `isShort: true`
- Buy back to cover short positions

### Background Services

| Service          | Interval  | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| Price Simulation | 1s        | Random walk price updates                |
| Matching Engine  | 1s        | Execute pending orders                   |
| Price History    | 60s       | Capture price snapshots                  |
| Data Cleanup     | 24h       | Remove old price data (30-day retention) |
| Notifications    | Real-time | WebSocket event emission                 |

---

## 📊 Performance

- **API Response**: < 150ms average
- **Calculator Speed**: < 50ms (pure computation)
- **WebSocket**: 1-second price updates
- **Database**: Indexed queries for fast lookups
- **Matching Engine**: < 50ms per order check

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens expire in 30 days
- Protected routes require valid token
- Funds validation on all financial operations
- Calculator endpoints are stateless — no data stored

---

## 🚀 Deployment

### Environment Variables (Production)

```env
PORT=5000
MONGO_URI=mongodb+srv://production_connection
JWT_SECRET=long_random_production_secret
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🐛 Troubleshooting

**"next is not a function" error**

- Ensure using Express 4.x: `npm install express@4.21.2`

**MongoDB Connection Failed**

- Check `MONGO_URI` in `.env`
- Verify network access in MongoDB Atlas

**Duplicate Index Warning**

- Drop old indexes: `db.watchlists.dropIndexes()` in MongoDB shell

---

## 📖 Documentation

- **Calculators API**: See `CALCULATORS.md`
- **Calculator Policy**: See `src/calculators/README.md`

---

## 📖 License

This is a learning project cloning Zerodha's functionality.

---

## 👨‍💻 Credits

Built with modern web technologies for educational purposes.

**Key Highlights:**

- 🎯 6 order types (Market, Limit, Short, Stop-Loss, Bracket, Cancel)
- 📊 10 professional financial calculators
- 🔄 Real-time price simulation (20 stocks)
- 💼 Complete portfolio management with P&L
- 🔔 WebSocket notifications
- 📈 Historical price data
- 🔒 Secure JWT authentication
- 💰 Funds management system

---

**Happy Trading! 📈**
