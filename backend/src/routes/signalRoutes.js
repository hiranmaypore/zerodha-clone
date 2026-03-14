const express = require('express');
const Signal = require('../models/Signal');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/signals?limit=20
router.get('/', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    if (!global.dbConnected) {
      const signals = global.inMemoryDB.signals.slice(0, limit);
      return res.json({ success: true, signals });
    }

    const signals = await Signal.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({ success: true, signals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
