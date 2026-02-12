const { calculateSTP } = require('../utils/formulas');
const { validateSTPInput } = require('../utils/validators');

/**
 * STP (Systematic Transfer Plan) Calculator Handler
 * POST /api/calculators/stp
 */
const stpCalculator = (req, res) => {
  try {
    const { initialInvestment, monthlyTransfer, sourceReturn, targetReturn, timePeriod } = req.body;
    
    // Validate input
    const validation = validateSTPInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate STP
    const result = calculateSTP(
      parseFloat(initialInvestment),
      parseFloat(monthlyTransfer),
      parseFloat(sourceReturn),
      parseFloat(targetReturn),
      parseInt(timePeriod)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('STP Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate STP',
      error: error.message
    });
  }
};

module.exports = { stpCalculator };
