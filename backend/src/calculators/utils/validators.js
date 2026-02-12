/**
 * Input validation utilities for calculators
 */

const validateSIPInput = (data) => {
  const errors = [];
  
  const { monthlyInvestment, expectedReturn, timePeriod } = data;
  
  if (!monthlyInvestment || monthlyInvestment <= 0) {
    errors.push('Monthly investment must be greater than 0');
  }
  
  if (monthlyInvestment > 10000000) {
    errors.push('Monthly investment cannot exceed ₹1 crore');
  }
  
  if (!expectedReturn || expectedReturn < 1 || expectedReturn > 50) {
    errors.push('Expected return must be between 1% and 50%');
  }
  
  if (!timePeriod || timePeriod < 1 || timePeriod > 50) {
    errors.push('Time period must be between 1 and 50 years');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateStepUpSIPInput = (data) => {
  const sipValidation = validateSIPInput(data);
  const errors = [...sipValidation.errors];
  
  const { annualIncrement } = data;
  
  if (annualIncrement === undefined || annualIncrement < 0 || annualIncrement > 50) {
    errors.push('Annual increment must be between 0% and 50%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateEMIInput = (data) => {
  const errors = [];
  
  const { loanAmount, interestRate, loanTenure } = data;
  
  if (!loanAmount || loanAmount <= 0) {
    errors.push('Loan amount must be greater than 0');
  }
  
  if (loanAmount > 1000000000) {
    errors.push('Loan amount cannot exceed ₹100 crore');
  }
  
  if (!interestRate || interestRate < 1 || interestRate > 50) {
    errors.push('Interest rate must be between 1% and 50%');
  }
  
  if (!loanTenure || loanTenure < 1 || loanTenure > 30) {
    errors.push('Loan tenure must be between 1 and 30 years');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateSWPInput = (data) => {
  const errors = [];
  
  const { initialInvestment, monthlyWithdrawal, expectedReturn, timePeriod } = data;
  
  if (!initialInvestment || initialInvestment <= 0) {
    errors.push('Initial investment must be greater than 0');
  }
  
  if (!monthlyWithdrawal || monthlyWithdrawal <= 0) {
    errors.push('Monthly withdrawal must be greater than 0');
  }
  
  if (monthlyWithdrawal > initialInvestment) {
    errors.push('Monthly withdrawal cannot exceed initial investment');
  }
  
  if (!expectedReturn || expectedReturn < 1 || expectedReturn > 50) {
    errors.push('Expected return must be between 1% and 50%');
  }
  
  if (!timePeriod || timePeriod < 1 || timePeriod > 50) {
    errors.push('Time period must be between 1 and 50 years');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateRetirementInput = (data) => {
  const errors = [];
  
  const { currentAge, retirementAge, monthlyExpenses, inflationRate, lifeExpectancy, expectedReturn } = data;
  
  if (!currentAge || currentAge < 18 || currentAge > 100) {
    errors.push('Current age must be between 18 and 100');
  }
  
  if (!retirementAge || retirementAge < 40 || retirementAge > 100) {
    errors.push('Retirement age must be between 40 and 100');
  }
  
  if (currentAge && retirementAge && retirementAge <= currentAge) {
    errors.push('Retirement age must be greater than current age');
  }
  
  if (!monthlyExpenses || monthlyExpenses <= 0) {
    errors.push('Monthly expenses must be greater than 0');
  }
  
  if (!inflationRate || inflationRate < 1 || inflationRate > 20) {
    errors.push('Inflation rate must be between 1% and 20%');
  }
  
  if (!lifeExpectancy || lifeExpectancy < 60 || lifeExpectancy > 120) {
    errors.push('Life expectancy must be between 60 and 120');
  }
  
  if (retirementAge && lifeExpectancy && lifeExpectancy <= retirementAge) {
    errors.push('Life expectancy must be greater than retirement age');
  }
  
  if (!expectedReturn || expectedReturn < 1 || expectedReturn > 50) {
    errors.push('Expected return must be between 1% and 50%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateNPSInput = (data) => {
  const errors = [];
  
  const { currentAge, retirementAge, monthlyContribution, expectedReturn } = data;
  
  if (!currentAge || currentAge < 18 || currentAge > 70) {
    errors.push('Current age must be between 18 and 70');
  }
  
  if (!retirementAge || retirementAge < 60 || retirementAge > 70) {
    errors.push('Retirement age for NPS must be between 60 and 70');
  }
  
  if (currentAge && retirementAge && retirementAge <= currentAge) {
    errors.push('Retirement age must be greater than current age');
  }
  
  if (!monthlyContribution || monthlyContribution < 1000) {
    errors.push('Monthly contribution must be at least ₹1,000');
  }
  
  if (monthlyContribution > 10000000) {
    errors.push('Monthly contribution cannot exceed ₹1 crore');
  }
  
  if (!expectedReturn || expectedReturn < 1 || expectedReturn > 50) {
    errors.push('Expected return must be between 1% and 50%');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateSTPInput = (data) => {
  const errors = [];
  
  const { initialInvestment, monthlyTransfer, sourceReturn, targetReturn, timePeriod } = data;
  
  if (!initialInvestment || initialInvestment <= 0) {
    errors.push('Initial investment must be greater than 0');
  }
  
  if (!monthlyTransfer || monthlyTransfer <= 0) {
    errors.push('Monthly transfer must be greater than 0');
  }
  
  if (initialInvestment && monthlyTransfer && monthlyTransfer * 12 > initialInvestment) {
    errors.push('Annual transfer cannot exceed initial investment');
  }
  
  if (!sourceReturn || sourceReturn < 1 || sourceReturn > 50) {
    errors.push('Source fund return must be between 1% and 50%');
  }
  
  if (!targetReturn || targetReturn < 1 || targetReturn > 50) {
    errors.push('Target fund return must be between 1% and 50%');
  }
  
  if (!timePeriod || timePeriod < 1 || timePeriod > 30) {
    errors.push('Time period must be between 1 and 30 years');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateSIPInput,
  validateStepUpSIPInput,
  validateEMIInput,
  validateSWPInput,
  validateRetirementInput,
  validateNPSInput,
  validateSTPInput
};
