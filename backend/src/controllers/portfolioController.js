const Holding = require('../models/Holding');
const User = require('../models/User');
const Order = require('../models/Order');
const { getPrices } = require('../services/priceSimulator');
const STOCKS = require('../config/stocks');

// @desc    Get user holdings with P&L
// @route   GET /api/holdings
// @access  Private
exports.getHoldings = async (req, res) => {
    try {
        const holdings = await Holding.find({ user: req.user._id });
        const prices = getPrices();

        const enriched = holdings.map(h => {
            const currentPrice = prices[h.stock] || 0;
            const investedValue = h.avgPrice * h.quantity;
            const currentValue = currentPrice * h.quantity;
            const pnl = currentValue - investedValue;
            const pnlPercent = investedValue > 0 ? ((pnl / investedValue) * 100) : 0;
            const stockInfo = STOCKS.find(s => s.symbol === h.stock);

            return {
                _id: h._id,
                stock: h.stock,
                name: stockInfo ? stockInfo.name : h.stock,
                quantity: h.quantity,
                avgPrice: parseFloat(h.avgPrice.toFixed(2)),
                currentPrice: parseFloat(currentPrice.toFixed(2)),
                investedValue: parseFloat(investedValue.toFixed(2)),
                currentValue: parseFloat(currentValue.toFixed(2)),
                pnl: parseFloat(pnl.toFixed(2)),
                pnlPercent: parseFloat(pnlPercent.toFixed(2)),
                isShort: h.isShort
            };
        });

        res.json({
            success: true,
            count: enriched.length,
            holdings: enriched
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching holdings", error: error.message });
    }
};

// @desc    Get user dashboard summary
// @route   GET /api/holdings/dashboard
// @access  Private
exports.getDashboard = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        const holdings = await Holding.find({ user: req.user._id });
        const prices = getPrices();

        let totalInvested = 0;
        let totalCurrentValue = 0;

        holdings.forEach(h => {
            const currentPrice = prices[h.stock] || 0;
            totalInvested += h.avgPrice * h.quantity;
            totalCurrentValue += currentPrice * h.quantity;
        });

        const totalPnl = totalCurrentValue - totalInvested;
        const totalPnlPercent = totalInvested > 0 ? ((totalPnl / totalInvested) * 100) : 0;

        // Recent orders
        const recentOrders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        res.json({
            success: true,
            dashboard: {
                user: {
                    name: user.name,
                    email: user.email,
                    balance: parseFloat(user.balance.toFixed(2))
                },
                portfolio: {
                    totalInvested: parseFloat(totalInvested.toFixed(2)),
                    currentValue: parseFloat(totalCurrentValue.toFixed(2)),
                    totalPnl: parseFloat(totalPnl.toFixed(2)),
                    totalPnlPercent: parseFloat(totalPnlPercent.toFixed(2)),
                    holdingsCount: holdings.length
                },
                netWorth: parseFloat((user.balance + totalCurrentValue).toFixed(2)),
                recentOrders
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching dashboard", error: error.message });
    }
};
