require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const logger = require("./utils/logger");
const { apiLimiter, authLimiter, orderLimiter } = require("./middleware/rateLimiter");

// In-memory store for demo mode (when DB is down)


const inMemoryDB = {
  users: new Map(),   // id -> user
  orders: new Map(),  // id -> order
  holdings: new Map(), // userId:stock -> holding
  signals: [],        // global signals array for demo mode
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
const alertRoutes = require("./routes/alertRoutes");
const signalRoutes = require("./routes/signalRoutes");


// Price Engine
const stocks = require("./config/stocks");
const fetchStockPrice = require("./services/priceFetcher");
const {
  startSimulation,
  setInitialPrices,
  getPrices
} = require("./services/priceSimulator");
const priceSocket = require("./sockets/priceSocket");
const startMatchingEngine = require('./services/matchingEngine');
const { startPriceHistoryService } = require('./services/priceHistoryService');
const { startAutoSquareOffService } = require('./services/autoSquareOff');
const { startAlertEngine } = require('./services/alertEngine');
const { startAlgoBot } = require('./services/algoBot');
const startEquityService = require('./services/equityService');

const app = express();


const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny', { stream: logger.stream }));
app.use('/api/', apiLimiter);

// API Routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/orders", orderLimiter, orderRoutes);
app.use("/api/holdings", portfolioRoutes);
app.use("/api/calculators", calculatorRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/signals", signalRoutes);
app.use("/api/algo", require('./routes/backtestRoutes'));


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
    logger.error(`🔥 GLOBAL ERROR HANDLER: ${err.message}`);
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
  logger.info("⏳ Setting initial stock prices...");

  await Promise.all(
    stocks.map(async (stock) => {
      initialPrices[stock.symbol] = await fetchStockPrice(stock.symbol);
    })
  );

  logger.info(`✅ Initial Prices Set: ${Object.keys(initialPrices).join(", ")}`);
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

      logger.warn("🟡 Demo Mode: Using in-memory store. Prices & WebSocket still work.");
    }


    // Always start price engine
    await initPrices();
    startSimulation(io);

    // Always start these (they handle demo mode internally)
    try { startMatchingEngine(); } catch(e) { logger.warn(`Matching engine warn: ${e.message}`); }
    try { startPriceHistoryService(); } catch(e) { logger.warn(`Price history warn: ${e.message}`); }

    priceSocket(io, getPrices);

    // Notifications (Always start so demo mode gets alerts too)
    try {
      const { initializeNotifications } = require('./services/orderNotifications');
      initializeNotifications(io);
    } catch (e) {
      logger.warn(`Notifications skipped: ${e.message}`);
    }

    // MIS Auto Square-Off — always start (handles both demo + DB)
    try { startAutoSquareOffService(io); } catch(e) { logger.warn(`AutoSquareOff warn: ${e.message}`); }

    // Alerts Engine
    try { startAlertEngine(io); } catch(e) { logger.warn(`AlertEngine warn: ${e.message}`); }

    // Algo Bot Engine
    try { startAlgoBot(io); } catch(e) { logger.warn(`AlgoBot warn: ${e.message}`); }

    // Equity Service (Equity Curve tracking)
    if (dbOk) {
      try { startEquityService(); } catch(e) { logger.warn(`EquityService warn: ${e.message}`); }
    }

    // User room management


    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      // Track subscribed symbols per client
      socket.subscribedSymbols = new Set();

      socket.on('join_user_room', (userId) => {
        socket.join(userId);
      });

      // Symbol subscription channels
      socket.on('subscribe_symbols', (symbols) => {
        if (Array.isArray(symbols)) {
          symbols.forEach(s => {
            const sym = s.toUpperCase();
            socket.subscribedSymbols.add(sym);
            socket.join(`stock:${sym}`);
          });
        }
      });

      socket.on('unsubscribe_symbols', (symbols) => {
        if (Array.isArray(symbols)) {
          symbols.forEach(s => {
            const sym = s.toUpperCase();
            socket.subscribedSymbols.delete(sym);
            socket.leave(`stock:${sym}`);
          });
        }
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
    // Graceful shutdown logic to release the port
    const shutdown = () => {
      logger.info('🛑 Shutting down server and releasing port...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGUSR2', shutdown); // For nodemon restarts

    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use by another instance. Please close the duplicate terminal or use a different port.`);
        process.exit(1);
      } else {
        logger.error(`❌ Server error: ${e.message}`);
        process.exit(1);
      }
    });

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} (${global.dbConnected ? '🟢 Live DB' : '🟡 Demo Mode'})`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
  }
})();
