const User = require('../models/User');

/**
 * Deposit funds
 * POST /api/funds/deposit
 */
exports.depositFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    if (amount > 10000000) {
      return res.status(400).json({ message: 'Maximum deposit is ₹1,00,00,000' });
    }

    const user = await User.findById(req.user._id);
    user.balance += amount;
    await user.save();

    res.json({
      success: true,
      message: `₹${amount.toLocaleString()} deposited successfully`,
      balance: parseFloat(user.balance.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Withdraw funds
 * POST /api/funds/withdraw
 */
exports.withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const user = await User.findById(req.user._id);

    if (user.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    user.balance -= amount;
    await user.save();

    res.json({
      success: true,
      message: `₹${amount.toLocaleString()} withdrawn successfully`,
      balance: parseFloat(user.balance.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get fund balance
 * GET /api/funds
 */
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance');
    res.json({
      success: true,
      balance: parseFloat(user.balance.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
