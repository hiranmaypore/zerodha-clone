const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');

      if (global.dbConnected) {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({ message: 'User not found' });
        }
      } else {
        // Demo mode: look up from in-memory store
        const mem = global.inMemoryDB;
        let user = mem.users.get(decoded.id);
        if (!user) {
          // Create a ghost user record on first access
          user = { _id: decoded.id, id: decoded.id, name: decoded.name || 'Demo User', email: decoded.email || 'demo@example.com', balance: 100000 };
          mem.users.set(decoded.id, user);
        }
        req.user = user;
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
