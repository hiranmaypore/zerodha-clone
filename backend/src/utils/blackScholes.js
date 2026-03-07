// Standard normal cumulative distribution function
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Black-Scholes Formula
function calcBS(optionType, S, K, T_days, volatility, riskFreeRate) {
  const T = Math.max(0.0001, T_days) / 365;
  const sigma = volatility / 100;
  const r = riskFreeRate / 100;
  
  const d1 = (Math.log(S / K) + (r + sigma * sigma / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  
  let price;
  if (optionType === 'call') {
    price = S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
  } else {
    price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
  }
  
  return price;
}

module.exports = { calcBS, normCDF };
