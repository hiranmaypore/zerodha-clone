const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/calculators';

console.log('🧮 TESTING PHASE 2: ADVANCED INVESTMENT CALCULATORS...\n');

// Test 1: Retirement Calculator
async function testRetirement() {
  console.log('1️⃣ Testing Retirement Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/retirement`, {
      currentAge: 30,
      retirementAge: 60,
      monthlyExpenses: 50000,
      inflationRate: 6,
      lifeExpectancy: 85,
      expectedReturn: 12
    });
    
    console.log('✅ Retirement Calculation Successful!');
    console.log(`   Current Age: 30 | Retirement Age: 60`);
    console.log(`   Years to Retirement: ${response.data.data.yearsToRetirement}`);
    console.log(`   Current Monthly Expenses: ₹${response.data.data.currentMonthlyExpenses.toLocaleString()}`);
    console.log(`   Future Monthly Expenses: ₹${response.data.data.futureMonthlyExpenses.toLocaleString()}`);
    console.log(`   Required Corpus: ₹${response.data.data.requiredCorpus.toLocaleString()}`);
    console.log(`   Monthly SIP Needed: ₹${response.data.data.monthlySIPRequired.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ Retirement Test Failed:', error.response?.data || error.message);
  }
}

// Test 2: NPS Calculator
async function testNPS() {
  console.log('2️⃣ Testing NPS Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/nps`, {
      currentAge: 30,
      retirementAge: 60,
      monthlyContribution: 10000,
      expectedReturn: 10,
      annuityRate: 6
    });
    
    console.log('✅ NPS Calculation Successful!');
    console.log(`   Years to Retirement: ${response.data.data.yearsToRetirement}`);
    console.log(`   Monthly Contribution: ₹${response.data.data.monthlyContribution.toLocaleString()}`);
    console.log(`   Total Investment: ₹${response.data.data.totalInvestment.toLocaleString()}`);
    console.log(`   Corpus at Retirement: ₹${response.data.data.corpusAtRetirement.toLocaleString()}`);
    console.log(`   Minimum Annuity (40%): ₹${response.data.data.minimumAnnuity.toLocaleString()}`);
    console.log(`   Maximum Lumpsum (60%): ₹${response.data.data.maximumLumpsum.toLocaleString()}`);
    console.log(`   Monthly Pension: ₹${response.data.data.monthlyPension.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ NPS Test Failed:', error.response?.data || error.message);
  }
}

// Test 3: STP Calculator
async function testSTP() {
  console.log('3️⃣ Testing STP Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/stp`, {
      initialInvestment: 1000000,
      monthlyTransfer: 25000,
      sourceReturn: 7,
      targetReturn: 12,
      timePeriod: 3
    });
    
    console.log('✅ STP Calculation Successful!');
    console.log(`   Initial Investment: ₹${response.data.data.initialInvestment.toLocaleString()}`);
    console.log(`   Monthly Transfer: ₹${response.data.data.monthlyTransfer.toLocaleString()}`);
    console.log(`   Total Transferred: ₹${response.data.data.totalTransferred.toLocaleString()}`);
    console.log(`   Final Source Balance: ₹${response.data.data.finalSourceBalance.toLocaleString()}`);
    console.log(`   Final Target Balance: ₹${response.data.data.finalTargetBalance.toLocaleString()}`);
    console.log(`   Total Value: ₹${response.data.data.totalValue.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ STP Test Failed:', error.response?.data || error.message);
  }
}

// Test 4: Validation Test
async function testValidation() {
  console.log('4️⃣ Testing NPS Validation...');
  try {
    await axios.post(`${BASE_URL}/nps`, {
      currentAge: 30,
      retirementAge: 55, // Invalid: NPS requires 60-70
      monthlyContribution: 500, // Invalid: minimum ₹1000
      expectedReturn: 10
    });
    console.log('❌ Validation should have failed!');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation Working Correctly!');
      console.log(`   Errors: ${error.response.data.errors.join(', ')}\n`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Run all tests
(async () => {
  try {
    await testRetirement();
    await testNPS();
   await testSTP();
    await testValidation();
    
    console.log('✅ ALL PHASE 2 CALCULATOR TESTS COMPLETED!\n');
    console.log('📊 New Endpoints Added:');
    console.log('   POST /api/calculators/retirement');
    console.log('   POST /api/calculators/nps');
    console.log('   POST /api/calculators/stp');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
