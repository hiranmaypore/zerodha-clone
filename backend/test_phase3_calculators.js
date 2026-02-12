const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/calculators';

console.log('🧮 TESTING PHASE 3: BROKERAGE & MARGIN CALCULATORS...\n');

// Test 1: Brokerage Calculator - Equity Delivery
async function testBrokerageDelivery() {
  console.log('1️⃣ Testing Brokerage Calculator (Equity Delivery)...');
  try {
    const response = await axios.post(`${BASE_URL}/brokerage`, {
      tradeType: 'equity_delivery',
      buyPrice: 1000,
      sellPrice: 1100,
      quantity: 100
    });
    
    console.log('✅ Equity Delivery Calculation Successful!');
    console.log(`   Buy: ₹1,000 × 100 = ₹${response.data.data.buyValue.toLocaleString()}`);
    console.log(`   Sell: ₹1,100 × 100 = ₹${response.data.data.sellValue.toLocaleString()}`);
    console.log(`   Brokerage: ₹${response.data.data.charges.brokerage} (FREE)`);
    console.log(`   Total Charges: ₹${response.data.data.charges.total}`);
    console.log(`   Net P&L: ₹${response.data.data.netPL.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ Delivery Test Failed:', error.response?.data || error.message);
  }
}

// Test 2: Brokerage Calculator - Intraday
async function testBrokerageIntraday() {
  console.log('2️⃣ Testing Brokerage Calculator (Equity Intraday)...');
  try {
    const response = await axios.post(`${BASE_URL}/brokerage`, {
      tradeType: 'equity_intraday',
      buyPrice: 500,
      sellPrice: 510,
      quantity: 200
    });
    
    console.log('✅ Equity Intraday Calculation Successful!');
    console.log(`   Turnover: ₹${response.data.data.turnover.toLocaleString()}`);
    console.log(`   Brokerage: ₹${response.data.data.charges.brokerage}`);
    console.log(`   STT: ₹${response.data.data.charges.stt}`);
    console.log(`   Total Charges: ₹${response.data.data.charges.total}`);
    console.log(`   Net P&L: ₹${response.data.data.netPL.toLocaleString()}`);
    console.log(`   Breakeven: ₹${response.data.data.breakeven}\n`);
  } catch (error) {
    console.log('❌ Intraday Test Failed:', error.response?.data || error.message);
  }
}

// Test 3: F&O Margin - Futures
async function testFOMarginFutures() {
  console.log('3️⃣ Testing F&O Margin (Futures)...');
  try {
    const response = await axios.post(`${BASE_URL}/fo-margin`, {
      instrumentType: 'futures',
      spotPrice: 18000,
      lotSize: 50,
      lots: 1,
      volatility: 15
    });
    
    console.log('✅ Futures Margin Calculation Successful!');
    console.log(`   Contract Value: ₹${response.data.data.contractValue.toLocaleString()}`);
    console.log(`   SPAN Margin: ₹${response.data.data.spanMargin.toLocaleString()}`);
    console.log(`   Exposure Margin: ₹${response.data.data.exposureMargin.toLocaleString()}`);
    console.log(`   Total Margin Required: ₹${response.data.data.totalMargin.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ Futures Margin Test Failed:', error.response?.data || error.message);
  }
}

// Test 4: F&O Margin - Options
async function testFOMarginOptions() {
  console.log('4️⃣ Testing F&O Margin (Options)...');
  try {
    const response = await axios.post(`${BASE_URL}/fo-margin`, {
      instrumentType: 'options',
      optionType: 'call',
      spotPrice: 18000,
      strikePrice: 18500,
      lotSize: 50,
      lots: 2,
      volatility: 20
    });
    
    console.log('✅ Options Margin Calculation Successful!');
    console.log(`   Option Type: ${response.data.data.optionType.toUpperCase()}`);
    console.log(`   Strike Price: ₹${response.data.data.strikePrice}`);
    console.log(`   Contract Value: ₹${response.data.data.contractValue.toLocaleString()}`);
    console.log(`   Total Margin Required: ₹${response.data.data.totalMargin.toLocaleString()}\n`);
  } catch (error) {
    console.log('❌ Options Margin Test Failed:', error.response?.data || error.message);
  }
}

// Test 5: Black-Scholes
async function testBlackScholes() {
  console.log('5️⃣ Testing Black-Scholes Option Pricing...');
  try {
    const response = await axios.post(`${BASE_URL}/black-scholes`, {
      optionType: 'call',
      spotPrice: 18000,
      strikePrice: 18500,
      daysToExpiry: 30,
      volatility: 20,
      riskFreeRate: 6.5
    });
    
    console.log('✅ Black-Scholes Calculation Successful!');
    console.log(`   Option Type: ${response.data.data.optionType.toUpperCase()}`);
    console.log(`   Theoretical Price: ₹${response.data.data.optionPrice}`);
    console.log(`   Greeks:`);
    console.log(`     Delta: ${response.data.data.greeks.delta}`);
    console.log(`     Gamma: ${response.data.data.greeks.gamma}`);
    console.log(`     Theta: ${response.data.data.greeks.theta}`);
    console.log(`     Vega: ${response.data.data.greeks.vega}`);
    console.log(`     Rho: ${response.data.data.greeks.rho}\n`);
  } catch (error) {
    console.log('❌ Black-Scholes Test Failed:', error.response?.data || error.message);
  }
}

// Test 6: Validation
async function testValidation() {
  console.log('6️⃣ Testing Input Validation...');
  try {
    await axios.post(`${BASE_URL}/brokerage`, {
      tradeType: 'invalid_type',
      buyPrice: -100,
      sellPrice: 100,
      quantity: 50
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
    await testBrokerageDelivery();
    await testBrokerageIntraday();
    await testFOMarginFutures();
    await testFOMarginOptions();
    await testBlackScholes();
    await testValidation();
    
    console.log('✅ ALL PHASE 3 CALCULATOR TESTS COMPLETED!\n');
    console.log('📊 New Endpoints Added:');
    console.log('   POST /api/calculators/brokerage');
    console.log('   POST /api/calculators/fo-margin');
    console.log('   POST /api/calculators/black-scholes');
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
