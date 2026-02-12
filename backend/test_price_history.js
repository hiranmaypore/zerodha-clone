const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

console.log('📊 TESTING HISTORICAL PRICE DATA...\n');

// Helper: Wait for price history to accumulate
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = response.data.token;
    console.log('✅ Logged in successfully\n');
  } catch (error) {
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = signupResponse.data.token;
    console.log('✅ Account created\n');
  }
}

// Test 1: Get current price
async function testGetCurrentPrice() {
  console.log('1️⃣ Testing: Get Current Price...');
  try {
    const response = await axios.get(`${BASE_URL}/prices/TCS`);
    
    console.log('✅ Current Price Retrieved!');
    console.log(`   Symbol: ${response.data.symbol}`);
    console.log(`   Price: ₹${response.data.price?.toFixed(2)}`);
    console.log(`   Timestamp: ${new Date(response.data.timestamp).toLocaleTimeString()}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 2: Wait for history to build
async function waitForHistory() {
  console.log('2️⃣ Waiting 65 seconds for price history to accumulate...');
  console.log('   (Background service captures prices every 60 seconds)\n');
  
  // Show countdown
  for (let i = 65; i > 0; i -= 5) {
    process.stdout.write(`   ⏳ ${i} seconds remaining...\r`);
    await wait(5000);
  }
  console.log('   ✅ Wait complete!                    \n');
}

// Test 3: Get historical data
async function testGetHistory() {
  console.log('3️⃣ Testing: Get Historical Data...');
  try {
    const response = await axios.get(`${BASE_URL}/prices/history/TCS`, {
      params: { limit: 10 }
    });
    
    console.log('✅ Historical Data Retrieved!');
    console.log(`   Symbol: ${response.data.symbol}`);
    console.log(`   Records: ${response.data.count}\n`);
    
    if (response.data.count > 0) {
      console.log('   Recent Price History:');
      response.data.data.slice(-5).forEach((record, idx) => {
        const time = new Date(record.timestamp).toLocaleTimeString();
        console.log(`   ${idx + 1}. ₹${record.price?.toFixed(2)} at ${time}`);
      });
    }
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 4: Get history with date range
async function testDateRange() {
  console.log('4️⃣ Testing: Get History with Date Range...');
  try {
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    
    const response = await axios.get(`${BASE_URL}/prices/history/INFY`, {
      params: {
        from: oneHourAgo.toISOString(),
        to: now.toISOString(),
        limit: 20
      }
    });
    
    console.log('✅ Date Range Query Working!');
    console.log(`   Symbol: ${response.data.symbol}`);
    console.log(`   Records in last hour: ${response.data.count}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 5: Test invalid symbol
async function testInvalidSymbol() {
  console.log('5️⃣ Testing: Invalid Symbol (should fail)...');
  try {
    await axios.get(`${BASE_URL}/prices/history/INVALID`);
    console.log('❌ Should have failed but succeeded!\n');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation Working!');
      console.log(`   Error: ${error.response.data.message}\n`);
    }
  }
}

// Test 6: Test limit validation
async function testLimitValidation() {
  console.log('6️⃣ Testing: Limit Validation...');
  try {
    await axios.get(`${BASE_URL}/prices/history/TCS`, {
      params: { limit: 2000 }
    });
    console.log('❌ Should have failed but succeeded!\n');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Limit Validation Working!');
      console.log(`   Error: ${error.response.data.message}\n`);
    }
  }
}

// Run all tests
(async () => {
  try {
    await login();
    await testGetCurrentPrice();
    await waitForHistory();
    await testGetHistory();
    await testDateRange();
    await testInvalidSymbol();
    await testLimitValidation();
    
    console.log('✅ ALL HISTORICAL PRICE TESTS COMPLETED!\n');
    console.log('📊 New Endpoints:');
    console.log('   GET /api/prices/:symbol');
    console.log('   GET /api/prices/history/:symbol?from=&to=&limit=');
    console.log('\n💡 Background service is capturing prices every 60 seconds');
    console.log('📈 Data can be used for charting and analytics!');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
