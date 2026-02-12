const { calculateSWP } = require('../utils/formulas');
const { validateSWPInput } = require('../utils/validators');

/**
 * SWP (Systematic Withdrawal Plan) Calculator Handler
 * POST /api/calculators/swp
 */
const swpCalculator = (req, res) => {
  try {
    const { initialInvestment, monthlyWithdrawal, expectedReturn, timePeriod } = req.body;
    
    // Validate input
    const validation = validateSWPInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate SWP
    const result = calculateSWP(
      parseFloat(initialInvestment),
      parseFloat(monthlyWithdrawal),
      parseFloat(expectedReturn),
      parseInt(timePeriod)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('SWP Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate SWP',
      error: error.message
    });
  }
};

module.exports = { swpCalculator };
