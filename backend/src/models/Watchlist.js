const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    unique: true // One watchlist per user
  },
  stocks: [{
    symbol: { 
      type: String, 
      required: true 
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    }
  }]
}, { timestamps: true });

// Index for fast lookups (removed duplicate userId index)
watchlistSchema.index({ 'stocks.symbol': 1 });

// Limit stocks to 50
watchlistSchema.path('stocks').validate(function(stocks) {
  return stocks.length <= 50;
}, 'Watchlist cannot contain more than 50 stocks');

module.exports = mongoose.model('Watchlist', watchlistSchema);
