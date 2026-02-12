require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes"); 
const portfolioRoutes = require("./routes/portfolioRoutes");
const calculatorRoutes = require("./routes/calculatorRoutes");
const watchlistRoutes = require("./routes/watchlistRoutes");
const priceRoutes = require("./routes/priceRoutes");

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

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('🔥 GLOBAL ERROR HANDLER:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ message: err.message });
});

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Initialize Order Notifications
const { initializeNotifications } = require('./services/orderNotifications');
initializeNotifications(io);

// User room management for notifications
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Join user-specific room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their notification room`);
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Initialize Price Engine
async function initPrices() {
  const initialPrices = {};
  console.log("Fetching initial stock prices...");

  for (let stock of stocks) {
    const price = await fetchStockPrice(stock.symbol);
    
    if (price) {
        initialPrices[stock.symbol] = price;
    } else {
        const randomFallback = Math.floor(Math.random() * (3000 - 500) + 500); 
        console.log(`Using fallback price for ${stock.symbol}: ${randomFallback}`);
        initialPrices[stock.symbol] = randomFallback;
    }
  }

  console.log("Initial Prices Set:", initialPrices);
  setInitialPrices(initialPrices);
}

// Start Server Sequence
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    await initPrices();
    startSimulation(io);
    startMatchingEngine();
    startPriceHistoryService();
    priceSocket(io, getPrices);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Routes loaded: /api/auth, /api/orders, /api/holdings, /api/prices`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
})();
