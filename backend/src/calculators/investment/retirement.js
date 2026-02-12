const { calculateRetirement } = require('../utils/formulas');
const { validateRetirementInput } = require('../utils/validators');

/**
 * Retirement Planning Calculator Handler
 * POST /api/calculators/retirement
 */
const retirementCalculator = (req, res) => {
  try {
    const { currentAge, retirementAge, monthlyExpenses, inflationRate, lifeExpectancy, expectedReturn } = req.body;
    
    // Validate input
    const validation = validateRetirementInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate Retirement Plan
    const result = calculateRetirement(
      parseInt(currentAge),
      parseInt(retirementAge),
      parseFloat(monthlyExpenses),
      parseFloat(inflationRate),
      parseInt(lifeExpectancy),
      parseFloat(expectedReturn)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Retirement Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate retirement plan',
      error: error.message
    });
  }
};

module.exports = { retirementCalculator };
