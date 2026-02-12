const { calculateNPS } = require('../utils/formulas');
const { validateNPSInput } = require('../utils/validators');

/**
 * NPS (National Pension Scheme) Calculator Handler
 * POST /api/calculators/nps
 */
const npsCalculator = (req, res) => {
  try {
    const { currentAge, retirementAge, monthlyContribution, expectedReturn, annuityRate } = req.body;
    
    // Validate input
    const validation = validateNPSInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate NPS
    const result = calculateNPS(
      parseInt(currentAge),
      parseInt(retirementAge),
      parseFloat(monthlyContribution),
      parseFloat(expectedReturn),
      annuityRate ? parseFloat(annuityRate) : 6
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('NPS Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate NPS',
      error: error.message
    });
  }
};

module.exports = { npsCalculator };
