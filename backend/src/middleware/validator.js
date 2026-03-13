// ── Input Validation Middleware ──
// Lightweight validation without external deps (Joi-like but zero-dependency)

function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rules.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }

      if (rules.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push(`${field} must be a number`);
        } else {
          if (rules.min !== undefined && num < rules.min) {
            errors.push(`${field} must be at least ${rules.min}`);
          }
          if (rules.max !== undefined && num > rules.max) {
            errors.push(`${field} must be at most ${rules.max}`);
          }
        }
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    next();
  };
}

// ── Pre-built schemas ──
const orderSchema = {
  stockSymbol: { required: true, type: 'string', maxLength: 30 },
  quantity: { required: true, type: 'number', min: 1, max: 100000 },
  orderType: { type: 'string', enum: ['MARKET', 'LIMIT'] },
  productType: { type: 'string', enum: ['CNC', 'MIS'] },
  limitPrice: { type: 'number', min: 0.01 },
};

const authSchema = {
  email: { required: true, type: 'string', maxLength: 100 },
  password: { required: true, type: 'string', maxLength: 128 },
};

const signupSchema = {
  name: { required: true, type: 'string', maxLength: 60 },
  email: { required: true, type: 'string', maxLength: 100 },
  password: { required: true, type: 'string', maxLength: 128 },
};

const fundsSchema = {
  amount: { required: true, type: 'number', min: 1, max: 10000000 },
};

module.exports = {
  validate,
  orderSchema,
  authSchema,
  signupSchema,
  fundsSchema,
};
