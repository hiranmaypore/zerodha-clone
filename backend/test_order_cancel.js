const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

console.log('🧪 TESTING ORDER CANCELLATION...\n');

// Helper function to login
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = response.data.token;
    console.log('✅ Logged in successfully\n');
    return response.data;
  } catch (error) {
    console.log('❌ Login failed. Creating new account...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = signupResponse.data.token;
    console.log('✅ Account created\n');
    return signupResponse.data;
  }
}

// Test 1: Place a LIMIT BUY order (will be PENDING)
async function testPlaceLimitOrder() {
  console.log('1️⃣ Testing: Place LIMIT BUY Order...');
  try {
    const response = await axios.post(
      `${BASE_URL}/orders/buy`,
      {
        stockSymbol: 'TCS',
        quantity: 10,
        orderType: 'LIMIT',
        limitPrice: 1000 // Very low price so it stays PENDING
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    const order = response.data;
    console.log('✅ LIMIT Order Placed!');
    console.log(`   Order ID: ${order._id}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Stock: ${order.stock}`);
    console.log(`   Quantity: ${order.quantity}`);
    console.log(`   Limit Price: ₹${order.limitPrice}\n`);
    
    return order._id;
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
    return null;
  }
}

// Test 2: Cancel the pending order
async function testCancelOrder(orderId) {
  console.log('2️⃣ Testing: Cancel Pending Order...');
  
  if (!orderId) {
    console.log('❌ No order ID to cancel\n');
    return;
  }
  
  try {
    const response = await axios.delete(
      `${BASE_URL}/orders/${orderId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Order Cancelled Successfully!');
    console.log(`   Order ID: ${response.data.order.orderId}`);
    console.log(`   Stock: ${response.data.order.stock}`);
    console.log(`   Status: ${response.data.order.status}`);
    console.log(`   Refunded: ₹${response.data.order.refundedAmount?.toLocaleString() || 0}`);
    console.log(`   Cancelled At: ${response.data.order.cancelledAt}\n`);
  } catch (error) {
    console.log('❌ Cancellation Failed:', error.response?.data?.message || error.message);
  }
}

// Test 3: Try to cancel an already cancelled order (should fail)
async function testCancelAlreadyCancelled(orderId) {
  console.log('3️⃣ Testing: Cancel Already Cancelled Order (should fail)...');
  
  if (!orderId) {
    console.log('❌ No order ID to test\n');
    return;
  }
  
  try {
    await axios.delete(
      `${BASE_URL}/orders/${orderId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log('❌ Should have failed but succeeded!\n');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation Working!');
      console.log(`   Error: ${error.response.data.message}\n`);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

// Test 4: View all orders to verify cancellation
async function testViewOrders() {
  console.log('4️⃣ Testing: View Order History...');
  try {
    const response = await axios.get(
      `${BASE_URL}/orders`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log(`✅ Found ${response.data.length} orders`);
    
    const cancelledOrders = response.data.filter(o => o.status === 'CANCELLED');
    console.log(`   Cancelled Orders: ${cancelledOrders.length}`);
    
    if (cancelledOrders.length > 0) {
      console.log(`\n   Latest Cancelled Order:`);
      const latest = cancelledOrders[0];
      console.log(`   - ${latest.stock} | ${latest.type} | Qty: ${latest.quantity}`);
      console.log(`   - Cancelled at: ${latest.cancelledAt}`);
    }
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Run all tests
(async () => {
  try {
    await login();
    
    const orderId = await testPlaceLimitOrder();
    await testCancelOrder(orderId);
    await testCancelAlreadyCancelled(orderId);
    await testViewOrders();
    
    console.log('✅ ALL ORDER CANCELLATION TESTS COMPLETED!\n');
    console.log('📊 New Endpoint:');
    console.log('   DELETE /api/orders/:orderId');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
