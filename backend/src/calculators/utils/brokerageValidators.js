/**
 * Validators for brokerage and margin calculators
 */

const validateBrokerageInput = (data) => {
  const errors = [];
  
  const { tradeType, buyPrice, sellPrice, quantity } = data;
  
  const validTradeTypes = ['equity_delivery', 'equity_intraday', 'fo_futures', 'fo_options'];
  if (!tradeType || !validTradeTypes.includes(tradeType)) {
    errors.push(`Trade type must be one of: ${validTradeTypes.join(', ')}`);
  }
  
  if (!buyPrice || buyPrice <= 0) {
    errors.push('Buy price must be greater than 0');
  }
  
  if (!sellPrice || sellPrice <= 0) {
    errors.push('Sell price must be greater than 0');
  }
  
  if (!quantity || quantity <= 0 || quantity > 1000000) {
    errors.push('Quantity must be between 1 and 1,000,000');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateFOMarginInput = (data) => {
  const errors = [];
  
  const { instrumentType, spotPrice, lotSize, lots } = data;
  
  if (!instrumentType || !['futures', 'options'].includes(instrumentType)) {
    errors.push('Instrument type must be "futures" or "options"');
  }
  
  if (instrumentType === 'options') {
    const { optionType, strikePrice } = data;
    if (!optionType || !['call', 'put'].includes(optionType)) {
      errors.push('Option type must be "call" or "put"');
    }
    if (!strikePrice || strikePrice <= 0) {
      errors.push('Strike price must be greater than 0');
    }
  }
  
  if (!spotPrice || spotPrice <= 0) {
    errors.push('Spot price must be greater than 0');
  }
  
  if (!lotSize || lotSize <= 0 || lotSize > 10000) {
    errors.push('Lot size must be between 1 and 10,000');
  }
  
  if (!lots || lots <= 0 || lots > 1000) {
    errors.push('Number of lots must be between 1 and 1,000');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBlackScholesInput = (data) => {
  const errors = [];
  
  const { optionType, spotPrice, strikePrice, daysToExpiry, volatility, riskFreeRate } = data;
  
  if (!optionType || !['call', 'put'].includes(optionType)) {
    errors.push('Option type must be "call" or "put"');
  }
  
  if (!spotPrice || spotPrice <= 0) {
    errors.push('Spot price must be greater than 0');
  }
  
  if (!strikePrice || strikePrice <= 0) {
    errors.push('Strike price must be greater than 0');
  }
  
  if (!daysToExpiry || daysToExpiry < 1 || daysToExpiry > 365) {
    errors.push('Days to expiry must be between 1 and 365');
  }
  
  if (!volatility || volatility < 1 || volatility > 200) {
    errors.push('Volatility must be between 1% and 200%');
  }
  
  if (riskFreeRate === undefined || riskFreeRate < 0 || riskFreeRate > 20) {
    errors.push('Risk-free rate must be between 0% and 20%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateBrokerageInput,
  validateFOMarginInput,
  validateBlackScholesInput
};
