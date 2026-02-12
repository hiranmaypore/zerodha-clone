const { calculateBlackScholes } = require('../utils/brokerageFormulas');
const { validateBlackScholesInput } = require('../utils/brokerageValidators');

/**
 * Black-Scholes Option Pricing Calculator Handler
 * POST /api/calculators/black-scholes
 */
const blackScholesCalculator = (req, res) => {
  try {
    const { optionType, spotPrice, strikePrice, daysToExpiry, volatility, riskFreeRate } = req.body;
    
    // Validate input
    const validation = validateBlackScholesInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate Black-Scholes
    const result = calculateBlackScholes(
      optionType,
      parseFloat(spotPrice),
      parseFloat(strikePrice),
      parseInt(daysToExpiry),
      parseFloat(volatility),
      parseFloat(riskFreeRate)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Black-Scholes Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate option price',
      error: error.message
    });
  }
};

module.exports = { blackScholesCalculator };
