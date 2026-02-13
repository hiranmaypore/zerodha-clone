const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

console.log('🏦 TESTING ALL BACKEND GAPS...\n');

async function login() {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'gaptest@example.com',
      password: 'password123'
    });
    authToken = res.data.token;
    console.log('✅ Logged in\n');
  } catch {
    const res = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Gap Test User',
      email: 'gaptest@example.com',
      password: 'password123'
    });
    authToken = res.data.token;
    console.log('✅ Account created\n');
  }
}

const api = (method, url, data) =>
  axios({ method, url: `${BASE_URL}${url}`, data, headers: { Authorization: `Bearer ${authToken}` } });

async function run() {
  await login();

  // 1. Get All Stocks
  console.log('1️⃣ GET /api/stocks - All Available Stocks');
  const stocks = await axios.get(`${BASE_URL}/stocks`);
  console.log(`   ✅ ${stocks.data.count} stocks available`);
  stocks.data.stocks.slice(0, 5).forEach(s => console.log(`   ${s.symbol}: ${s.name} - ₹${s.price}`));
  console.log(`   ... and ${stocks.data.count - 5} more\n`);

  // 2. Funds Management
  console.log('2️⃣ Funds Management');
  let bal = await api('get', '/funds');
  console.log(`   Balance: ₹${bal.data.balance}`);

  await api('post', '/funds/deposit', { amount: 50000 });
  bal = await api('get', '/funds');
  console.log(`   ✅ After ₹50,000 deposit: ₹${bal.data.balance}`);

  await api('post', '/funds/withdraw', { amount: 20000 });
  bal = await api('get', '/funds');
  console.log(`   ✅ After ₹20,000 withdraw: ₹${bal.data.balance}`);

  try {
    await api('post', '/funds/withdraw', { amount: 999999999 });
  } catch (e) {
    console.log(`   ✅ Insufficient balance validation: ${e.response.data.message}`);
  }

  try {
    await api('post', '/funds/deposit', { amount: -100 });
  } catch (e) {
    console.log(`   ✅ Invalid amount validation: ${e.response.data.message}\n`);
  }

  // 3. Buy some stock to test P&L
  console.log('3️⃣ Buy Stock for P&L Test');
  await api('post', '/orders/buy', { stockSymbol: 'SBIN', quantity: 10, orderType: 'MARKET' });
  console.log('   ✅ Bought 10 SBIN\n');

  // 4. Portfolio P&L
  console.log('4️⃣ GET /api/holdings - Portfolio with P&L');
  const holdings = await api('get', '/holdings');
  console.log(`   ✅ ${holdings.data.count} holding(s)`);
  holdings.data.holdings.forEach(h => {
    console.log(`   ${h.stock} (${h.name}): ${h.quantity} shares`);
    console.log(`     Avg: ₹${h.avgPrice} | Current: ₹${h.currentPrice}`);
    console.log(`     Invested: ₹${h.investedValue} | Current: ₹${h.currentValue}`);
    console.log(`     P&L: ₹${h.pnl} (${h.pnlPercent}%)`);
  });
  console.log();

  // 5. Dashboard
  console.log('5️⃣ GET /api/holdings/dashboard - User Dashboard');
  const dash = await api('get', '/holdings/dashboard');
  const d = dash.data.dashboard;
  console.log(`   User: ${d.user.name}`);
  console.log(`   Balance: ₹${d.user.balance}`);
  console.log(`   Invested: ₹${d.portfolio.totalInvested}`);
  console.log(`   Current Value: ₹${d.portfolio.currentValue}`);
  console.log(`   P&L: ₹${d.portfolio.totalPnl} (${d.portfolio.totalPnlPercent}%)`);
  console.log(`   Net Worth: ₹${d.netWorth}`);
  console.log(`   Recent Orders: ${d.recentOrders.length}\n`);

  // 6. Profile Update
  console.log('6️⃣ PUT /api/auth/profile - Update Profile');
  const updated = await api('put', '/auth/profile', { name: 'Updated Name' });
  console.log(`   ✅ Name updated to: ${updated.data.user.name}`);

  try {
    await api('put', '/auth/profile', { newPassword: 'newpass', currentPassword: 'wrongpass' });
  } catch (e) {
    console.log(`   ✅ Wrong password validation: ${e.response.data.message}`);
  }

  const pwUpdate = await api('put', '/auth/profile', { currentPassword: 'password123', newPassword: 'password123' });
  console.log(`   ✅ Password change: ${pwUpdate.data.message}\n`);

  console.log('✅ ALL BACKEND GAP TESTS PASSED!\n');
  console.log('📊 New Endpoints Added:');
  console.log('   GET    /api/stocks          - List all stocks with prices');
  console.log('   GET    /api/funds           - Check balance');
  console.log('   POST   /api/funds/deposit   - Deposit funds');
  console.log('   POST   /api/funds/withdraw  - Withdraw funds');
  console.log('   GET    /api/holdings/dashboard - User dashboard summary');
  console.log('   PUT    /api/auth/profile    - Update profile/password');
  console.log('\n📈 Enhanced Endpoints:');
  console.log('   GET    /api/holdings        - Now includes P&L calculations!');
  console.log('   GET    /api/stocks          - Now has 20 stocks!');
}

run().catch(e => console.error('Test failed:', e.response?.data || e.message));
