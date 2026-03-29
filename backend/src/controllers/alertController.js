const Alert = require('../models/Alert');

exports.createAlert = async (req, res) => {
  try {
    const { stock, condition, targetPrice } = req.body;
    const userId = req.user._id || req.user.id;
    
    if (!stock || !condition || !targetPrice) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (!global.dbConnected) {
      if (!global.inMemoryDB.alerts) global.inMemoryDB.alerts = new Map();
      const id = global.inMemoryDB.newId();
      const alert = {
        _id: id,
        user: userId.toString(),
        stock,
        condition,
        targetPrice: parseFloat(targetPrice),
        isActive: true,
        createdAt: new Date().toISOString()
      };
      global.inMemoryDB.alerts.set(id, alert);
      return res.status(201).json({ success: true, alert });
    }

    const alert = await Alert.create({
      user: userId,
      stock,
      condition,
      targetPrice: parseFloat(targetPrice)
    });

    res.status(201).json({ success: true, alert });
  } catch (error) {
    res.status(500).json({ message: 'Error creating alert', error: error.message });
  }
};

exports.getAlerts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    
    if (!global.dbConnected) {
      if (!global.inMemoryDB.alerts) global.inMemoryDB.alerts = new Map();
      const alerts = [...global.inMemoryDB.alerts.values()].filter(a => a.user === userId.toString());
      alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.json({ success: true, alerts });
    }

    const alerts = await Alert.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching alerts', error: error.message });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    if (!global.dbConnected) {
      if (global.inMemoryDB.alerts) global.inMemoryDB.alerts.delete(id);
      return res.json({ success: true });
    }
    await Alert.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting alert', error: error.message });
  }
};
