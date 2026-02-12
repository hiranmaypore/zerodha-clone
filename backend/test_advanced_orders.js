const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let testUserId = '';

console.log('🎯 TESTING ADVANCED ORDERS...\n');

// Helper function to login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'advancedtest@example.com',
      password: 'password123'
    });
    authToken = response.data.token;
    testUserId = response.data._id;
    console.log('✅ Logged in successfully\n');
  } catch (error) {
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Advanced Test User',
      email: 'advancedtest@example.com',
      password: 'password123'
    });
    authToken = signupResponse.data.token;
    testUserId = signupResponse.data._id;
    console.log('✅ Account created with ₹1,00,000\n');
  }
}

// Helper: Buy some stock first for stop-loss test
async function buyStockForTest() {
  console.log('0️⃣ Setup: Buying TCS stock for stop-loss test...');
  try {
    await axios.post(
      `${BASE_URL}/orders/buy`,
      {
        stockSymbol: 'TCS',
        quantity: 10,
        orderType: 'MARKET'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('✅ Bought 10 TCS shares\n');
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 1: Place Stop-Loss Order
async function testStopLoss() {
  console.log('1️⃣ Testing: Place Stop-Loss Order...');
  try {
    const response = await axios.post(
      `${BASE_URL}/orders/stop-loss`,
      {
        stockSymbol: 'TCS',
        quantity: 5,
        triggerPrice: 0.10 // Very low trigger for testing
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Stop-Loss Order Placed!');
    console.log(`   Order ID: ${response.data.order.orderId}`);
    console.log(`   Stock: ${response.data.order.stock}`);
    console.log(`   Quantity: ${response.data.order.quantity}`);
    console.log(`   Trigger Price: ₹${response.data.order.triggerPrice}`);
    console.log(`   Status: ${response.data.order.status}\n`);
    
    return response.data.order.orderId;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: Place Bracket Order
async function testBracketOrder() {
  console.log('2️⃣ Testing: Place Bracket Order...');
  try {
    const response = await axios.post(
      `${BASE_URL}/orders/bracket`,
      {
        stockSymbol: 'INFY',
        quantity: 5,
        entryPrice: 2000,
        targetPrice: 2100,
        stopLossPrice: 1900
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Bracket Order Placed!');
    console.log(`   Order ID: ${response.data.order.orderId}`);
    console.log(`   Stock: ${response.data.order.stock}`);
    console.log(`   Quantity: ${response.data.order.quantity}`);
    console.log(`   Entry: ₹${response.data.order.entryPrice}`);
    console.log(`   Target: ₹${response.data.order.targetPrice}`);
    console.log(`   Stop-Loss: ₹${response.data.order.stopLossPrice}`);
    console.log(`   Status: ${response.data.order.status}\n`);
    
    return response.data.order.orderId;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 3: Validation - Invalid stop-loss
async function testInvalidStopLoss() {
  console.log('3️⃣ Testing: Invalid Stop-Loss (without holdings)...');
  try {
    await axios.post(
      `${BASE_URL}/orders/stop-loss`,
      {
        stockSymbol: 'RELIANCE',
        quantity: 100,
        triggerPrice: 1000
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Should have failed but succeeded!\n');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation Working!');
      console.log(`   Error: ${error.response.data.message}\n`);
    }
  }
}

// Test 4: Validation - Invalid bracket order
async function testInvalidBracket() {
  console.log('4️⃣ Testing: Invalid Bracket (stop-loss above entry)...');
  try {
    await axios.post(
      `${BASE_URL}/orders/bracket`,
      {
        stockSymbol: 'HDFC',
        quantity: 5,
        entryPrice: 1000,
        targetPrice: 1100,
        stopLossPrice: 1050 // Higher than entry - invalid
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Should have failed but succeeded!\n');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation Working!');
      console.log(`   Error: ${error.response.data.message}\n`);
    }
  }
}

// Test 5: View all orders
async function testViewOrders() {
  console.log('5️⃣ Testing: View All Orders...');
  try {
    const response = await axios.get(
      `${BASE_URL}/orders`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const stopLossOrders = response.data.filter(o => o.orderCategory === 'STOPLOSS');
    const bracketOrders = response.data.filter(o => o.orderCategory === 'BRACKET');
    
    console.log(`✅ Found ${response.data.length} total orders`);
    console.log(`   Stop-Loss Orders: ${stopLossOrders.length}`);
    console.log(`   Bracket Orders: ${bracketOrders.length}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Run all tests
(async () => {
  try {
    await login();
    await buyStockForTest();
    await testStopLoss();
    await testBracketOrder();
    await testInvalidStopLoss();
    await testInvalidBracket();
    await testViewOrders();
    
    console.log('✅ ALL ADVANCED ORDER TESTS COMPLETED!\n');
    console.log('📊 New Endpoints:');
    console.log('   POST /api/orders/stop-loss');
    console.log('   POST /api/orders/bracket');
    console.log('\n💡 Matching engine will trigger these orders based on price!');
    console.log('📈 Stop-loss triggers when price drops');
    console.log('🎯 Bracket creates entry + target + stop-loss legs');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
