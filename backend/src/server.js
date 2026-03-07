require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

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
const alertRoutes = require("./routes/alertRoutes");


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
app.use(express.json());
app.use(morgan('tiny', { stream: logger.stream }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/holdings", portfolioRoutes);
app.use("/api/calculators", calculatorRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/funds", fundsRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/alerts", alertRoutes);


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

    // Notifications (only if DB connected)
    if (dbOk) {
      try {
        const { initializeNotifications } = require('./services/orderNotifications');
        initializeNotifications(io);
      } catch(e) { logger.warn(`Notifications skipped: ${e.message}`); }
    }

    // MIS Auto Square-Off — always start (handles both demo + DB)
    try { startAutoSquareOffService(io); } catch(e) { logger.warn(`AutoSquareOff warn: ${e.message}`); }

    // Alerts Engine
    try { startAlertEngine(io); } catch(e) { logger.warn(`AlertEngine warn: ${e.message}`); }

    // Algo Bot Engine
    try { startAlgoBot(io); } catch(e) { logger.warn(`AlgoBot warn: ${e.message}`); }

    // User room management


    io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('join_user_room', (userId) => {
        socket.join(userId);
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} (${global.dbConnected ? '🟢 Live DB' : '🟡 Demo Mode'})`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
  }
})();
