const Holding = require('../models/Holding');

// @desc    Get user holdings
// @route   GET /api/holdings
// @access  Private
exports.getHoldings = async (req, res) => {
    try {
        const holdings = await Holding.find({ user: req.user._id });
        res.json(holdings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching holdings" });
    }
}
