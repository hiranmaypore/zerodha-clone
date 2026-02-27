require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

// In-memory store for demo mode (when DB is down)
const inMemoryDB = {
  users: new Map(),   // id -> user
  orders: new Map(),  // id -> order
  holdings: new Map(), // userId:stock -> holding
  _nextId: 1,
  newId() { return String(this._nextId++); }
};
global.inMemoryDB = inMemoryDB;
global.dbConnected = false;

// Routes
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes"); 
const portfolioRoutes = require("./routes/portfolioRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const priceRoutes = require("./routes/priceRoutes");
const fundsRoutes = require("./routes/fundsRoutes");
const stockRoutes = require("./routes/stockRoutes");

// Price Engine
const stocks = require("./config/stocks");
const fetchStockPrice = require("./services/priceFetcher");
const {
  startSimulation,
  setInitialPrices,
  getPrices
} = require("./services/priceSimulator");
const priceSocket = require("./sockets/priceSocket");
const startMatchingEngine = require("./services/matchingEngine");
const { startPriceHistoryService } = require("./services/priceHistoryService");

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/holdings", portfolioRoutes);
app.use("/api/calculators", calculatorRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/stocks", stockRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected: global.dbConnected,
    mode: global.dbConnected ? 'live' : 'demo'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL ERROR HANDLER:', err.message);
    res.status(500).json({ message: err.message });
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Initialize Price Engine
async function initPrices() {
  const initialPrices = {};
  console.log("⏳ Setting initial stock prices...");

  await Promise.all(
    stocks.map(async (stock) => {
      initialPrices[stock.symbol] = await fetchStockPrice(stock.symbol);
    })
  );

  console.log("✅ Initial Prices Set:", Object.keys(initialPrices).join(", "));
  setInitialPrices(initialPrices);
}

// Start Server Sequence
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    // Try DB — non-fatal
    const dbOk = await connectDB();
    global.dbConnected = !!dbOk;

    if (!dbOk) {
      console.log("🟡 Demo Mode: Using in-memory store. Prices & WebSocket still work.");
    }

    // Always start price engine
    await initPrices();
    startSimulation(io);

    // Always start these (they handle demo mode internally)
    try { startMatchingEngine(); } catch(e) { console.warn('Matching engine warn:', e.message); }
    try { startPriceHistoryService(); } catch(e) { console.warn('Price history warn:', e.message); }

    priceSocket(io, getPrices);

    // Notifications (only if DB connected)
    if (dbOk) {
      try {
        const { initializeNotifications } = require('./services/orderNotifications');
        initializeNotifications(io);
      } catch(e) { console.warn('Notifications skipped:', e.message); }
    }

    // User room management
    io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      socket.on('join_user_room', (userId) => {
        socket.join(userId);
      });
      
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} (${global.dbConnected ? '🟢 Live DB' : '🟡 Demo Mode'})`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
})();
