const { calculateFOMargin } = require('../utils/brokerageFormulas');
const { validateFOMarginInput } = require('../utils/brokerageValidators');

/**
 * F&O Margin Calculator Handler
 * POST /api/calculators/fo-margin
 */
const foMarginCalculator = (req, res) => {
  try {
    const { instrumentType, optionType, spotPrice, strikePrice, lotSize, lots, volatility } = req.body;
    
    // Validate input
    const validation = validateFOMarginInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate F&O Margin
    const result = calculateFOMargin(
      instrumentType,
      optionType || null,
      parseFloat(spotPrice),
      strikePrice ? parseFloat(strikePrice) : null,
      parseInt(lotSize),
      parseInt(lots),
      volatility ? parseFloat(volatility) : 20
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('F&O Margin Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate F&O margin',
      error: error.message
    });
  }
};

module.exports = { foMarginCalculator };
