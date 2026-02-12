const { calculateBrokerage } = require('../utils/brokerageFormulas');
const { validateBrokerageInput } = require('../utils/brokerageValidators');

/**
 * Brokerage Calculator Handler
 * POST /api/calculators/brokerage
 */
const brokerageCalculator = (req, res) => {
  try {
    const { tradeType, buyPrice, sellPrice, quantity } = req.body;
    
    // Validate input
    const validation = validateBrokerageInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }
    
    // Calculate Brokerage
    const result = calculateBrokerage(
      tradeType,
      parseFloat(buyPrice),
      parseFloat(sellPrice),
      parseInt(quantity)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Brokerage Calculation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate brokerage',
      error: error.message
    });
  }
};

module.exports = { brokerageCalculator };
