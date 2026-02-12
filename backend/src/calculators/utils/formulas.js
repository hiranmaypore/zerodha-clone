/**
 * Common Financial Formulas
 */

/**
 * Calculate compound interest future value
 * @param {number} principal - Initial amount
 * @param {number} rate - Annual interest rate (as percentage)
 * @param {number} time - Time period in years
 * @returns {number} Future value
 */
const compoundInterest = (principal, rate, time) => {
  const r = rate / 100;
  return principal * Math.pow(1 + r, time);
};

/**
 * Calculate SIP future value
 * @param {number} monthlyInvestment - Monthly SIP amount
 * @param {number} annualReturn - Expected annual return (%)
 * @param {number} years - Investment period in years
 * @returns {object} Detailed SIP calculation
 */
const calculateSIP = (monthlyInvestment, annualReturn, years) => {
  const monthlyRate = annualReturn / 12 / 100;
  const months = years * 12;
  
  // Future Value of SIP = P × {[(1 + r)^n - 1] / r} × (1 + r)
  const futureValue = monthlyInvestment * 
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  
  const totalInvestment = monthlyInvestment * months;
  const estimatedReturns = futureValue - totalInvestment;
  
  // Calculate year-wise breakdown
  const breakdown = [];
  for (let year = 1; year <= years; year++) {
    const monthsElapsed = year * 12;
    const invested = monthlyInvestment * monthsElapsed;
    const value = monthlyInvestment * 
      (((Math.pow(1 + monthlyRate, monthsElapsed) - 1) / monthlyRate) * (1 + monthlyRate));
    
    breakdown.push({
      year,
      invested: Math.round(invested),
      value: Math.round(value),
      returns: Math.round(value - invested)
    });
  }
  
  return {
    totalInvestment: Math.round(totalInvestment),
    estimatedReturns: Math.round(estimatedReturns),
    futureValue: Math.round(futureValue),
    breakdown
  };
};

/**
 * Calculate Step-up SIP
 * @param {number} monthlyInvestment - Initial monthly SIP amount
 * @param {number} annualReturn - Expected annual return (%)
 * @param {number} years - Investment period in years
 * @param {number} annualIncrement - Annual increment percentage
 * @returns {object} Detailed step-up SIP calculation
 */
const calculateStepUpSIP = (monthlyInvestment, annualReturn, years, annualIncrement) => {
  const monthlyRate = annualReturn / 12 / 100;
  const incrementRate = annualIncrement / 100;
  
  let totalInvestment = 0;
  let futureValue = 0;
  const breakdown = [];
  
  for (let year = 1; year <= years; year++) {
    const yearlyInvestment = monthlyInvestment * Math.pow(1 + incrementRate, year - 1);
    const monthsRemaining = (years - year + 1) * 12;
    
    // Calculate FV for this year's investments
    const yearlyFV = yearlyInvestment * 12 * 
      (((Math.pow(1 + monthlyRate, monthsRemaining) - 1) / monthlyRate) * (1 + monthlyRate));
    
    totalInvestment += yearlyInvestment * 12;
    futureValue += yearlyFV;
    
    breakdown.push({
      year,
      monthlyInvestment: Math.round(yearlyInvestment),
      yearlyInvestment: Math.round(yearlyInvestment * 12),
      cumulativeInvestment: Math.round(totalInvestment),
      value: Math.round(futureValue)
    });
  }
  
  return {
    totalInvestment: Math.round(totalInvestment),
    estimatedReturns: Math.round(futureValue - totalInvestment),
    futureValue: Math.round(futureValue),
    breakdown
  };
};

/**
 * Calculate EMI
 * @param {number} loanAmount - Principal loan amount
 * @param {number} annualRate - Annual interest rate (%)
 * @param {number} tenureYears - Loan tenure in years
 * @returns {object} EMI calculation with amortization
 */
const calculateEMI = (loanAmount, annualRate, tenureYears) => {
  const monthlyRate = annualRate / 12 / 100;
  const months = tenureYears * 12;
  
  // EMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1]
  const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
    (Math.pow(1 + monthlyRate, months) - 1);
  
  const totalAmount = emi * months;
  const totalInterest = totalAmount - loanAmount;
  
  // Generate amortization schedule (yearly summary)
  const amortizationSchedule = [];
  let balance = loanAmount;
  
  for (let year = 1; year <= tenureYears; year++) {
    let yearlyPrincipal = 0;
    let yearlyInterest = 0;
    
    for (let month = 1; month <= 12; month++) {
      const interest = balance * monthlyRate;
      const principal = emi - interest;
      
      yearlyPrincipal += principal;
      yearlyInterest += interest;
      balance -= principal;
    }
    
    amortizationSchedule.push({
      year,
      principal: Math.round(yearlyPrincipal),
      interest: Math.round(yearlyInterest),
      balance: Math.round(Math.max(0, balance))
    });
  }
  
  return {
    emi: Math.round(emi),
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
    loanAmount: Math.round(loanAmount),
    amortizationSchedule
  };
};

/**
 * Calculate SWP (Systematic Withdrawal Plan)
 * @param {number} initialInvestment - Initial corpus
 * @param {number} monthlyWithdrawal - Monthly withdrawal amount
 * @param {number} annualReturn - Expected annual return (%)
 * @param {number} years - Withdrawal period in years
 * @returns {object} SWP calculation
 */
const calculateSWP = (initialInvestment, monthlyWithdrawal, annualReturn, years) => {
  const monthlyRate = annualReturn / 12 / 100;
  const months = years * 12;
  
  let balance = initialInvestment;
  const breakdown = [];
  let totalWithdrawn = 0;
  
  for (let year = 1; year <= years; year++) {
    let yearlyWithdrawal = 0;
    
    for (let month = 1; month <= 12; month++) {
      balance = balance * (1 + monthlyRate) - monthlyWithdrawal;
      yearlyWithdrawal += monthlyWithdrawal;
      
      if (balance < 0) {
        balance = 0;
        break;
      }
    }
    
    totalWithdrawn += yearlyWithdrawal;
    
    breakdown.push({
      year,
      withdrawn: Math.round(yearlyWithdrawal),
      balance: Math.round(balance)
    });
    
    if (balance === 0) break;
  }
  
  return {
    initialInvestment: Math.round(initialInvestment),
    totalWithdrawn: Math.round(totalWithdrawn),
    finalBalance: Math.round(balance),
    breakdown
  };
};

/**
 * Calculate Retirement Planning
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Planned retirement age
 * @param {number} monthlyExpenses - Current monthly expenses
 * @param {number} inflationRate - Expected inflation rate (%)
 * @param {number} lifeExpectancy - Expected life expectancy
 * @param {number} expectedReturn - Expected return on investments (%)
 * @returns {object} Retirement calculation
 */
const calculateRetirement = (currentAge, retirementAge, monthlyExpenses, inflationRate, lifeExpectancy, expectedReturn) => {
  const yearsToRetirement = retirementAge - currentAge;
  const retirementYears = lifeExpectancy - retirementAge;
  
  // Future monthly expenses at retirement (adjusted for inflation)
  const futureMonthlyExpenses = monthlyExpenses * Math.pow(1 + inflationRate / 100, yearsToRetirement);
  const annualExpenses = futureMonthlyExpenses * 12;
  
  // Corpus needed for retirement (using perpetuity formula adjusted for inflation)
  // Assuming 4% withdrawal rate is safe
  const withdrawalRate = 4 / 100;
  const requiredCorpus = annualExpenses / withdrawalRate;
  
  // Monthly SIP required to build corpus
  const monthlyRate = expectedReturn / 12 / 100;
  const months = yearsToRetirement * 12;
  
  const monthlySIPRequired = requiredCorpus / 
    (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
  
  return {
    currentAge,
    retirementAge,
    yearsToRetirement,
    retirementYears,
    currentMonthlyExpenses: Math.round(monthlyExpenses),
    futureMonthlyExpenses: Math.round(futureMonthlyExpenses),
    requiredCorpus: Math.round(requiredCorpus),
    monthlySIPRequired: Math.round(monthlySIPRequired),
    totalInvestment: Math.round(monthlySIPRequired * months)
  };
};

/**
 * Calculate NPS (National Pension Scheme)
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Retirement age (max 70)
 * @param {number} monthlyContribution - Monthly NPS contribution
 * @param {number} expectedReturn - Expected annual return (%)
 * @param {number} annuityRate - Annuity purchase rate (%)
 * @returns {object} NPS calculation
 */
const calculateNPS = (currentAge, retirementAge, monthlyContribution, expectedReturn, annuityRate = 6) => {
  const years = retirementAge - currentAge;
  
  // Calculate corpus at retirement using SIP formula
  const sipResult = calculateSIP(monthlyContribution, expectedReturn, years);
  const corpusAtRetirement = sipResult.futureValue;
  
  // NPS rule: Minimum 40% must be used to purchase annuity
  const minimumAnnuity = corpusAtRetirement * 0.40;
  const maximumLumpsum = corpusAtRetirement * 0.60;
  
  // Monthly pension from annuity (assuming annuity rate)
  const monthlyPension = (minimumAnnuity * annuityRate / 100) / 12;
  
  return {
    currentAge,
    retirementAge,
    yearsToRetirement: years,
    monthlyContribution: Math.round(monthlyContribution),
    totalInvestment: sipResult.totalInvestment,
    corpusAtRetirement: Math.round(corpusAtRetirement),
    minimumAnnuity: Math.round(minimumAnnuity),
    maximumLumpsum: Math.round(maximumLumpsum),
    monthlyPension: Math.round(monthlyPension),
    breakdown: sipResult.breakdown
  };
};

/**
 * Calculate STP (Systematic Transfer Plan)
 * @param {number} initialInvestment - Initial investment in source fund
 * @param {number} monthlyTransfer - Monthly transfer amount
 * @param {number} sourceReturn - Expected return in source fund (%)
 * @param {number} targetReturn - Expected return in target fund (%)
 * @param {number} years - Transfer period in years
 * @returns {object} STP calculation
 */
const calculateSTP = (initialInvestment, monthlyTransfer, sourceReturn, targetReturn, years) => {
  const months = years * 12;
  const sourceMonthlyRate = sourceReturn / 12 / 100;
  const targetMonthlyRate = targetReturn / 12 / 100;
  
  let sourceBalance = initialInvestment;
  let targetBalance = 0;
  const breakdown = [];
  
  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      // Source fund: grows with return, reduces by transfer
      sourceBalance = sourceBalance * (1 + sourceMonthlyRate) - monthlyTransfer;
      
      // Target fund: receives transfer and grows
      targetBalance = (targetBalance + monthlyTransfer) * (1 + targetMonthlyRate);
      
      if (sourceBalance < 0) {
        sourceBalance = 0;
        break;
      }
    }
    
    breakdown.push({
      year,
      sourceBalance: Math.round(sourceBalance),
      targetBalance: Math.round(targetBalance),
      totalValue: Math.round(sourceBalance + targetBalance)
    });
    
    if (sourceBalance === 0) break;
  }
  
  const totalTransferred = Math.min(monthlyTransfer * months, initialInvestment);
  
  return {
    initialInvestment: Math.round(initialInvestment),
    monthlyTransfer: Math.round(monthlyTransfer),
    totalTransferred: Math.round(totalTransferred),
    finalSourceBalance: Math.round(sourceBalance),
    finalTargetBalance: Math.round(targetBalance),
    totalValue: Math.round(sourceBalance + targetBalance),
    breakdown
  };
};

module.exports = {
  compoundInterest,
  calculateSIP,
  calculateStepUpSIP,
  calculateEMI,
  calculateSWP,
  calculateRetirement,
  calculateNPS,
  calculateSTP
};
