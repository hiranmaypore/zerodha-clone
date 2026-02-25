const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

const generateToken = (id, name, email) => {
  return jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: '30d' });
};

// ─── Register ──────────────────────────────────────────────
exports.registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  if (!global.dbConnected) {
    // Demo mode
    const mem = global.inMemoryDB;
    for (const [, u] of mem.users) {
      if (u.email === email) return res.status(400).json({ message: 'User already exists' });
    }
    const id = crypto.randomUUID();
    const user = { _id: id, id, name, email, balance: 100000, password };
    mem.users.set(id, user);
    return res.status(201).json({
      _id: id, name, email, balance: 100000,
      token: generateToken(id, name, email),
    });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, balance: 100000 });
    if (user) {
      res.status(201).json({
        _id: user._id, name: user.name, email: user.email, balance: user.balance,
        token: generateToken(user._id, user.name, user.email),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Login ─────────────────────────────────────────────────
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  if (!global.dbConnected) {
    // Demo mode: find or auto-create user
    const mem = global.inMemoryDB;
    let found = null;
    for (const [, u] of mem.users) {
      if (u.email === email) { found = u; break; }
    }
    if (found) {
      if (found.password !== password) return res.status(401).json({ message: 'Invalid email or password' });
      return res.json({
        _id: found._id, name: found.name, email: found.email, balance: found.balance,
        token: generateToken(found._id, found.name, found.email),
      });
    }
    // Auto-create demo account
    const id = crypto.randomUUID();
    const user = { _id: id, id, name: email.split('@')[0], email, balance: 100000, password };
    mem.users.set(id, user);
    return res.json({
      _id: id, name: user.name, email, balance: 100000,
      token: generateToken(id, user.name, email),
    });
  }

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id, name: user.name, email: user.email, balance: user.balance,
        token: generateToken(user._id, user.name, user.email),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Get Profile ───────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  if (!global.dbConnected) {
    const u = req.user;
    return res.json({ _id: u._id, name: u.name, email: u.email, balance: u.balance });
  }
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (user) res.json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Update Profile ────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  if (!global.dbConnected) {
    const u = req.user;
    if (req.body.name) u.name = req.body.name;
    return res.json({ success: true, user: { _id: u._id, name: u.name, email: u.email, balance: u.balance } });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { name, currentPassword, newPassword } = req.body;
    if (name) user.name = name;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) return res.status(401).json({ message: 'Current password incorrect' });
      user.password = newPassword;
    }
    await user.save();
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, balance: user.balance } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
