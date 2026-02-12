const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/calculators';

console.log('🧮 TESTING FINANCIAL CALCULATORS...\n');

// Test 1: SIP Calculator
async function testSIP() {
  console.log('1️⃣ Testing SIP Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/sip`, {
      monthlyInvestment: 5000,
      expectedReturn: 12,
      timePeriod: 10
    });
    
    console.log('✅ SIP Calculation Successful!');
    console.log(`   Monthly Investment: ₹${response.data.data.totalInvestment / 120}`);
    console.log(`   Total Investment: ₹${response.data.data.totalInvestment.toLocaleString()}`);
    console.log(`   Estimated Returns: ₹${response.data.data.estimatedReturns.toLocaleString()}`);
    console.log(`   Future Value: ₹${response.data.data.futureValue.toLocaleString()}`);
    console.log(`   First Year Value: ₹${response.data.data.breakdown[0].value.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ SIP Test Failed:', error.response?.data || error.message);
  }
}

// Test 2: Step-up SIP Calculator
async function testStepUpSIP() {
  console.log('2️⃣ Testing Step-up SIP Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/step-up-sip`, {
      monthlyInvestment: 5000,
      expectedReturn: 12,
      timePeriod: 10,
      annualIncrement: 10
    });
    
    console.log('✅ Step-up SIP Calculation Successful!');
    console.log(`   Initial Monthly Investment: ₹5,000`);
    console.log(`   Annual Increment: 10%`);
    console.log(`   Total Investment: ₹${response.data.data.totalInvestment.toLocaleString()}`);
    console.log(`   Estimated Returns: ₹${response.data.data.estimatedReturns.toLocaleString()}`);
    console.log(`   Future Value: ₹${response.data.data.futureValue.toLocaleString()}`);
    console.log(`   Year 10 Monthly SIP: ₹${response.data.data.breakdown[9].monthlyInvestment.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ Step-up SIP Test Failed:', error.response?.data || error.message);
  }
}

// Test 3: EMI Calculator
async function testEMI() {
  console.log('3️⃣ Testing EMI Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/emi`, {
      loanAmount: 1000000,
      interestRate: 8.5,
      loanTenure: 20
    });
    
    console.log('✅ EMI Calculation Successful!');
    console.log(`   Loan Amount: ₹${response.data.data.loanAmount.toLocaleString()}`);
    console.log(`   Interest Rate: 8.5%`);
    console.log(`   Tenure: 20 years`);
    console.log(`   Monthly EMI: ₹${response.data.data.emi.toLocaleString()}`);
    console.log(`   Total Amount: ₹${response.data.data.totalAmount.toLocaleString()}`);
    console.log(`   Total Interest: ₹${response.data.data.totalInterest.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ EMI Test Failed:', error.response?.data || error.message);
  }
}

// Test 4: SWP Calculator
async function testSWP() {
  console.log('4️⃣ Testing SWP Calculator...');
  try {
    const response = await axios.post(`${BASE_URL}/swp`, {
      initialInvestment: 5000000,
      monthlyWithdrawal: 50000,
      expectedReturn: 10,
      timePeriod: 15
    });
    
    console.log('✅ SWP Calculation Successful!');
    console.log(`   Initial Investment: ₹${response.data.data.initialInvestment.toLocaleString()}`);
    console.log(`   Monthly Withdrawal: ₹50,000`);
    console.log(`   Total Withdrawn: ₹${response.data.data.totalWithdrawn.toLocaleString()}`);
    console.log(`   Final Balance: ₹${response.data.data.finalBalance.toLocaleString()}`);
    console.log(`   Year 5 Balance: ₹${response.data.data.breakdown[4].balance.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ SWP Test Failed:', error.response?.data || error.message);
  }
}

// Test 5: Validation Test (should fail)
async function testValidation() {
  console.log('5️⃣ Testing Input Validation...');
  try {
    await axios.post(`${BASE_URL}/sip`, {
      monthlyInvestment: -5000, // Invalid negative value
      expectedReturn: 12,
      timePeriod: 10
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
    await testSIP();
    await testStepUpSIP();
    await testEMI();
    await testSWP();
    await testValidation();
    
    console.log('✅ ALL CALCULATOR TESTS COMPLETED!\n');
    console.log('📊 Available Endpoints:');
    console.log('   POST /api/calculators/sip');
    console.log('   POST /api/calculators/step-up-sip');
    console.log('   POST /api/calculators/emi');
    console.log('   POST /api/calculators/swp');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
