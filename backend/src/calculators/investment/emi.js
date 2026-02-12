const { calculateEMI } = require('../utils/formulas');
const { validateEMIInput } = require('../utils/validators');

/**
 * EMI Calculator Handler
 * POST /api/calculators/emi
 */
const emiCalculator = (req, res) => {
  try {
    const { loanAmount, interestRate, loanTenure } = req.body;
    
    // Validate input
    const validation = validateEMIInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate EMI
    const result = calculateEMI(
      parseFloat(loanAmount),
      parseFloat(interestRate),
      parseInt(loanTenure)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('EMI Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate EMI',
      error: error.message
    });
  }
};

module.exports = { emiCalculator };
