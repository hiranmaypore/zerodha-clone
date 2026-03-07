const User = require('../models/User');

exports.depositFunds = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id || req.user.id;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });
  if (amount > 10000000) return res.status(400).json({ message: 'Maximum deposit is ₹1,00,00,000' });

  if (!global.dbConnected) {
    const user = global.inMemoryDB.users.get(userId) || req.user;
    user.balance = (user.balance || 0) + Number(amount);
    return res.json({ success: true, message: `₹${amount.toLocaleString()} deposited`, balance: parseFloat(user.balance.toFixed(2)) });
  }
  try {
    const user = await User.findById(userId);
    user.balance += Number(amount);
    await user.save();
    res.json({ success: true, message: `₹${amount.toLocaleString()} deposited successfully`, balance: parseFloat(user.balance.toFixed(2)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.withdrawFunds = async (req, res) => {
  const { amount } = req.body;
  const userId = req.user._id || req.user.id;
  if (!amount || amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

  if (!global.dbConnected) {
    const user = global.inMemoryDB.users.get(userId) || req.user;
    if ((user.balance || 0) < amount) return res.status(400).json({ message: 'Insufficient balance' });
    user.balance -= Number(amount);
    return res.json({ success: true, message: `₹${amount.toLocaleString()} withdrawn`, balance: parseFloat(user.balance.toFixed(2)) });
  }
  try {
    const user = await User.findById(userId);
    if (user.balance < amount) return res.status(400).json({ message: 'Insufficient balance' });
    user.balance -= Number(amount);
    await user.save();
    res.json({ success: true, message: `₹${amount.toLocaleString()} withdrawn successfully`, balance: parseFloat(user.balance.toFixed(2)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBalance = async (req, res) => {
  const userId = req.user._id || req.user.id;
  if (!global.dbConnected) {
    const user = global.inMemoryDB.users.get(userId) || req.user;
    return res.json({ success: true, balance: parseFloat((user.balance || 0).toFixed(2)) });
  }
  try {
    const user = await User.findById(userId).select('balance');
    res.json({ success: true, balance: parseFloat(user.balance.toFixed(2)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
const NetWorth = require('../models/NetWorth');

exports.getEquityCurve = async (req, res) => {
  const userId = req.user._id || req.user.id;
  
  if (!global.dbConnected) {
    // Generate some mock historical data for demo mode
    const mockData = [];
    const now = new Date();
    let val = 100000;
    for (let i = 10; i >= 0; i--) {
      val += (Math.random() - 0.45) * 2000; // slight upward bias
      mockData.push({
        timestamp: new Date(now.getTime() - i * 3600000), // hourly
        netWorth: parseFloat(val.toFixed(2)),
        cash: 50000,
        holdingsValue: val - 50000
      });
    }
    return res.json({ success: true, history: mockData });
  }

  try {
    const history = await NetWorth.find({ userId })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
