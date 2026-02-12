const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

console.log('📋 TESTING WATCHLIST SYSTEM...\n');

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

// Test 1: Get empty watchlist
async function testGetEmptyWatchlist() {
  console.log('1️⃣ Testing: Get Watchlist (should be empty initially)...');
  try {
    const response = await axios.get(
      `${BASE_URL}/watchlist`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Watchlist Retrieved!');
    console.log(`   Stocks in watchlist: ${response.data.watchlist.length}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 2: Add stocks to watchlist
async function testAddToWatchlist() {
  console.log('2️⃣ Testing: Add Stocks to Watchlist...');
  
  const stocks = ['TCS', 'INFY', 'RELIANCE'];
  
  for (const stock of stocks) {
    try {
      const response = await axios.post(
        `${BASE_URL}/watchlist`,
        { symbol: stock },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      console.log(`✅ Added ${response.data.stock} to watchlist`);
    } catch (error) {
      console.log(`❌ Failed to add ${stock}:`, error.response?.data?.message);
    }
  }
  console.log();
}

// Test 3: Get watchlist with stocks
async function testGetWatchlist() {
  console.log('3️⃣ Testing: Get Watchlist with stocks...');
  try {
    const response = await axios.get(
      `${BASE_URL}/watchlist`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Watchlist Retrieved!');
    console.log(`   Total stocks: ${response.data.watchlist.length}\n`);
    
    response.data.watchlist.forEach(stock => {
      console.log(`   - ${stock.symbol}: ${stock.name}`);
      console.log(`     Price: ₹${stock.currentPrice?.toFixed(2) || 'N/A'}`);
      console.log(`     Added: ${new Date(stock.addedAt).toLocaleDateString()}`);
    });
    console.log();
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 4: Try to add duplicate
async function testAddDuplicate() {
  console.log('4️⃣ Testing: Add Duplicate Stock (should fail)...');
  try {
    await axios.post(
      `${BASE_URL}/watchlist`,
      { symbol: 'TCS' },
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

// Test 5: Try invalid stock
async function testInvalidStock() {
  console.log('5️⃣ Testing: Add Invalid Stock (should fail)...');
  try {
    await axios.post(
      `${BASE_URL}/watchlist`,
      { symbol: 'INVALID123' },
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

// Test 6: Remove stock from watchlist
async function testRemoveFromWatchlist() {
  console.log('6️⃣ Testing: Remove Stock from Watchlist...');
  try {
    const response = await axios.delete(
      `${BASE_URL}/watchlist/INFY`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Stock Removed!');
    console.log(`   Removed: ${response.data.stock}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Test 7: Final watchlist check
async function testFinalWatchlist() {
  console.log('7️⃣ Testing: Final Watchlist State...');
  try {
    const response = await axios.get(
      `${BASE_URL}/watchlist`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Final Watchlist:');
    console.log(`   Total stocks: ${response.data.watchlist.length}`);
    console.log(`   Stocks: ${response.data.watchlist.map(s => s.symbol).join(', ')}\n`);
  } catch (error) {
    console.log('❌ Failed:', error.response?.data?.message || error.message);
  }
}

// Run all tests
(async () => {
  try {
    await login();
    await testGetEmptyWatchlist();
    await testAddToWatchlist();
    await testGetWatchlist();
    await testAddDuplicate();
    await testInvalidStock();
    await testRemoveFromWatchlist();
    await testFinalWatchlist();
    
    console.log('✅ ALL WATCHLIST TESTS COMPLETED!\n');
    console.log('📊 New Endpoints:');
    console.log('   GET    /api/watchlist');
    console.log('   POST   /api/watchlist');
    console.log('   DELETE /api/watchlist/:symbol');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
})();
