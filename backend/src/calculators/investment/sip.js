const { calculateSIP } = require('../utils/formulas');
const { validateSIPInput } = require('../utils/validators');

/**
 * SIP Calculator Handler
 * POST /api/calculators/sip
 */
const sipCalculator = (req, res) => {
  try {
    const { monthlyInvestment, expectedReturn, timePeriod } = req.body;
    
    // Validate input
    const validation = validateSIPInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate SIP
    const result = calculateSIP(
      parseFloat(monthlyInvestment),
      parseFloat(expectedReturn),
      parseInt(timePeriod)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('SIP Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate SIP',
      error: error.message
    });
  }
};

module.exports = { sipCalculator };
