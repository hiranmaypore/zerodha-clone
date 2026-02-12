const { calculateStepUpSIP } = require('../utils/formulas');
const { validateStepUpSIPInput } = require('../utils/validators');

/**
 * Step-up SIP Calculator Handler
 * POST /api/calculators/step-up-sip
 */
const stepUpSIPCalculator = (req, res) => {
  try {
    const { monthlyInvestment, expectedReturn, timePeriod, annualIncrement } = req.body;
    
    // Validate input
    const validation = validateStepUpSIPInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate Step-up SIP
    const result = calculateStepUpSIP(
      parseFloat(monthlyInvestment),
      parseFloat(expectedReturn),
      parseInt(timePeriod),
      parseFloat(annualIncrement)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Step-up SIP Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate Step-up SIP',
      error: error.message
    });
  }
};

module.exports = { stepUpSIPCalculator };
