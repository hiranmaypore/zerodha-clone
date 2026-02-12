/**
 * Brokerage and Margin Calculation Formulas
 * Based on Zerodha's fee structure
 */

/**
 * Calculate Brokerage and Charges
 * @param {string} tradeType - 'equity_delivery', 'equity_intraday', 'fo_futures', 'fo_options'
 * @param {number} buyPrice - Buy price per share/contract
 * @param {number} sellPrice - Sell price per share/contract
 * @param {number} quantity - Number of shares/contracts
 * @returns {object} Detailed brokerage breakdown
 */
const calculateBrokerage = (tradeType, buyPrice, sellPrice, quantity) => {
  const buyValue = buyPrice * quantity;
  const sellValue = sellPrice * quantity;
  const turnover = buyValue + sellValue;
  
  let brokerage = 0;
  let stt = 0;
  let exchangeCharge = 0;
  let stampDuty = 0;
  
  // Zerodha Brokerage Structure
  switch(tradeType) {
    case 'equity_delivery':
      brokerage = 0; // Free for delivery
      stt = sellValue * 0.001; // 0.1% on sell side
      exchangeCharge = turnover * 0.0000325; // 0.00325%
      stampDuty = buyValue * 0.00015; // 0.015% on buy
      break;
      
    case 'equity_intraday':
      brokerage = Math.min(20, turnover * 0.0003) * 2; // ₹20 or 0.03% per trade (both buy & sell)
      stt = sellValue * 0.00025; // 0.025% on sell
      exchangeCharge = turnover * 0.0000325;
      stampDuty = buyValue * 0.00003; // 0.003% on buy
      break;
      
    case 'fo_futures':
      brokerage = Math.min(20, turnover * 0.0003) * 2;
      stt = sellValue * 0.0001; // 0.01% on sell (non-agricultural)
      exchangeCharge = turnover * 0.0000195; // 0.00195%
      stampDuty = buyValue * 0.00002; // 0.002% on buy
      break;
      
    case 'fo_options':
      brokerage = 20 * 2; // Flat ₹20 per order (both legs)
      stt = sellValue * 0.0005; // 0.05% on sell of options (premium)
      exchangeCharge = turnover * 0.000053; // 0.0053%
      stampDuty = buyValue * 0.00003; // 0.003% on buy
      break;
  }
  
  const sebiCharge = turnover * 0.0000001; // ₹10 per crore
  const gst = (brokerage + exchangeCharge + sebiCharge) * 0.18; // 18% GST
  
  const totalCharges = brokerage + stt + exchangeCharge + gst + sebiCharge + stampDuty;
  const grossPL = sellValue - buyValue;
  const netPL = grossPL - totalCharges;
  const breakeven = buyPrice + (totalCharges / (2 * quantity));
  
  return {
    tradeType,
    buyValue: Math.round(buyValue * 100) / 100,
    sellValue: Math.round(sellValue * 100) / 100,
    turnover: Math.round(turnover * 100) / 100,
    quantity,
    charges: {
      brokerage: Math.round(brokerage * 100) / 100,
      stt: Math.round(stt * 100) / 100,
      exchangeCharge: Math.round(exchangeCharge * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      sebiCharge: Math.round(sebiCharge * 100) / 100,
      stampDuty: Math.round(stampDuty * 100) / 100,
      total: Math.round(totalCharges * 100) / 100
    },
    grossPL: Math.round(grossPL * 100) / 100,
    netPL: Math.round(netPL * 100) / 100,
    breakeven: Math.round(breakeven * 100) / 100
  };
};

/**
 * Calculate F&O Margin
 * @param {string} instrumentType - 'futures' or 'options'
 * @param {string} optionType - 'call' or 'put' (only for options)
 * @param {number} spotPrice - Current spot price
 * @param {number} strikePrice - Strike price (for options)
 * @param {number} lotSize - Lot size
 * @param {number} lots - Number of lots
 * @param {number} volatility - Implied volatility (%)
 * @returns {object} Margin calculation
 */
const calculateFOMargin = (instrumentType, optionType, spotPrice, strikePrice, lotSize, lots, volatility = 20) => {
  const quantity = lotSize * lots;
  const contractValue = spotPrice * quantity;
  
  let spanMargin = 0;
  let exposureMargin = 0;
  
  if (instrumentType === 'futures') {
    // SPAN margin: ~10-15% of contract value (using volatility)
    spanMargin = contractValue * (volatility / 100) * 0.5;
    // Exposure margin: 3% of contract value
    exposureMargin = contractValue * 0.03;
  } else if (instrumentType === 'options') {
    const premium = calculateOptionPremium(optionType, spotPrice, strikePrice, volatility);
    const premiumValue = premium * quantity;
    
    // For option selling
    spanMargin = Math.max(
      premiumValue + contractValue * 0.03,
      contractValue * (volatility / 100) * 0.5
    );
    exposureMargin = contractValue * 0.03;
  }
  
  const totalMargin = spanMargin + exposureMargin;
  
  return {
    instrumentType,
    optionType: instrumentType === 'options' ? optionType : null,
    spotPrice,
    strikePrice: instrumentType === 'options' ? strikePrice : null,
    lotSize,
    lots,
    quantity,
    contractValue: Math.round(contractValue),
    spanMargin: Math.round(spanMargin),
    exposureMargin: Math.round(exposureMargin),
    totalMargin: Math.round(totalMargin)
  };
};

/**
 * Simple option premium estimation (simplified Black-Scholes)
 */
const calculateOptionPremium = (optionType, spot, strike, volatility, days = 30) => {
  const intrinsic = optionType === 'call' ? 
    Math.max(0, spot - strike) : 
    Math.max(0, strike - spot);
  const timeValue = (volatility / 100) * spot * Math.sqrt(days / 365);
  return intrinsic + timeValue * 0.5;
};

/**
 * Black-Scholes Option Pricing Model
 * @param {string} optionType - 'call' or 'put'
 * @param {number} spotPrice - Current spot price
 * @param {number} strikePrice - Strike price
 * @param {number} daysToExpiry - Days to expiration
 * @param {number} volatility - Implied volatility (%)
 * @param {number} riskFreeRate - Risk-free interest rate (%)
 * @returns {object} Option price and Greeks
 */
const calculateBlackScholes = (optionType, spotPrice, strikePrice, daysToExpiry, volatility, riskFreeRate) => {
  const S = spotPrice;
  const K = strikePrice;
  const T = daysToExpiry / 365;
  const sigma = volatility / 100;
  const r = riskFreeRate / 100;
  
  // Standard normal cumulative distribution function
  const normCDF = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  };
  
  // Standard normal probability density function
  const normPDF = (x) => {
    return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);
  };
  
  // Calculate d1 and d2
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  // Calculate option price
  let optionPrice;
  if (optionType === 'call') {
    optionPrice = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  } else {
    optionPrice = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
  }
  
  // Calculate Greeks
  const delta = optionType === 'call' ? normCDF(d1) : normCDF(d1) - 1;
  const gamma = normPDF(d1) / (S * sigma * Math.sqrt(T));
  const theta = optionType === 'call' ?
    (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * normCDF(d2)) / 365 :
    (-S * normPDF(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
  const vega = S * normPDF(d1) * Math.sqrt(T) / 100;
  const rho = optionType === 'call' ?
    K * T * Math.exp(-r * T) * normCDF(d2) / 100 :
    -K * T * Math.exp(-r * T) * normCDF(-d2) / 100;
  
  return {
    optionType,
    spotPrice,
    strikePrice,
    daysToExpiry,
    volatility,
    riskFreeRate,
    optionPrice: Math.round(optionPrice * 100) / 100,
    greeks: {
      delta: Math.round(delta * 10000) / 10000,
      gamma: Math.round(gamma * 1000000) / 1000000,
      theta: Math.round(theta * 100) / 100,
      vega: Math.round(vega * 100) / 100,
      rho: Math.round(rho * 100) / 100
    }
  };
};

module.exports = {
  calculateBrokerage,
  calculateFOMargin,
  calculateBlackScholes
};
