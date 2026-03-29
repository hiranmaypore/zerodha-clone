const { validationResult, body } = require('express-validator');

// Validation execution middleware — used as the LAST element in a schema array
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// ── Authentication Schemas ──
const signupSchema = [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email').trim().isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  validate
];

const loginSchema = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// ── Order Schemas ──
const orderSchema = [
  body('stockSymbol').trim().notEmpty().withMessage('Stock symbol is required'),
  body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  body('orderType').optional().isIn(['MARKET', 'LIMIT', 'SL', 'SL-M']).withMessage('Invalid order type'),
  body('productType').optional().isIn(['CNC', 'MIS', 'NRML']).withMessage('Invalid product type'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('limitPrice').optional().isFloat({ gt: 0 }).withMessage('Limit price must be a positive number'),
  validate
];

// ── Funds Schemas ──
const fundsSchema = [
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  validate
];

// ── Calculator Schemas ──
const sipSchema = [
  body('monthlyInvestment').isFloat({ gt: 0 }),
  body('expectedReturn').isFloat({ min: 0, max: 100 }),
  body('timePeriod').isFloat({ gt: 0 }),
  validate
];

module.exports = {
  validate,
  signupSchema,
  loginSchema,
  orderSchema,
  fundsSchema,
  sipSchema
};
