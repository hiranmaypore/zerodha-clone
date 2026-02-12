const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';

// Load Credentials
const credentials = require('./test_credentials.json');

// Test Data
// We append timestamp to email to create unique users for signup tests,
// but fallback to the base email for login if user exists.
const uniqueEmail = `tester${Date.now()}@zerodhaclone.com`;

const userCredentials = {
    name: credentials.name,
    email: uniqueEmail,
    password: credentials.password
};

const marketBuyOrder = {
    stockSymbol: "TCS",
    quantity: 10,
    orderType: "MARKET"
};

const limitBuyOrder = {
    stockSymbol: "RELIANCE",
    quantity: 5,
    orderType: "LIMIT",
    limitPrice: 3500 // Likely to execute immediately if current price < 3500
};

const shortSellOrder = {
    stockSymbol: "INFY",
    quantity: 5,
    orderType: "MARKET"
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
    console.log('🚀 INITIALIZING BACKEND TEST SUITE...');
    console.log('Target URL:', BASE_URL);

    // 1. Signup
    console.log('\n📝 1. Testing Signup...');
    try {
        const res = await axios.post(`${BASE_URL}/auth/signup`, userCredentials);
        token = res.data.token;
        userId = res.data._id;
        console.log(`✅ Signup Successful!`); 
        console.log(`   User: ${res.data.name} (${res.data.email})`);
        console.log(`   Balance: ₹${res.data.balance}`);
    } catch (e) {
        if(e.response && e.response.status === 400 && e.response.data.message === 'User already exists') {
             console.log('⚠️ User exists, logging in...');
             const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                 email: userCredentials.email,
                 password: userCredentials.password
             });
             token = loginRes.data.token;
             console.log('✅ Login Successful');
        } else {
             console.error('❌ Signup/Login Failed:', e.response ? e.response.data : e.message);
             return;
        }
    }

    const authConfig = { headers: { Authorization: `Bearer ${token}` } };

    // 2. Buy Market Order
    console.log('\n📈 2. Testing MARKET BUY Order (TCS)...');
    try {
        const res = await axios.post(`${BASE_URL}/orders/buy`, marketBuyOrder, authConfig);
        console.log(`✅ Order Placed! ID: ${res.data._id}`);
        console.log(`   Status: ${res.data.status} | Price: ${res.data.price}`);
    } catch (e) {
        console.error('❌ Market Buy Failed:', e.response ? e.response.data : e.message);
    }

    // 3. Short Sell
    console.log('\n📉 3. Testing SHORT SELL Order (INFY)...');
    try {
        const res = await axios.post(`${BASE_URL}/orders/sell`, shortSellOrder, authConfig);
        console.log(`✅ Short Sell Placed! ID: ${res.data._id}`);
        console.log(`   Status: ${res.data.status} | Price: ${res.data.price}`);
    } catch (e) {
        console.error('❌ Short Sell Failed:', e.response ? e.response.data : e.message);
    }

    // 4. Limit Buy Order
    console.log('\n⏳ 4. Testing LIMIT BUY Order (RELIANCE)...');
    console.log(`   Limit Price: ${limitBuyOrder.limitPrice}`);
    try {
        const res = await axios.post(`${BASE_URL}/orders/buy`, limitBuyOrder, authConfig);
        console.log(`✅ Limit Order Placed! ID: ${res.data._id}`);
        console.log(`   Status: ${res.data.status}`);
        
        if (res.data.status === 'PENDING') {
            console.log('   ℹ️ Order is PENDING. Waiting 5 seconds for Matching Engine...');
            await sleep(5000);
            // Check status again
            const orderRes = await axios.get(`${BASE_URL}/orders`, authConfig);
            const updatedOrder = orderRes.data.find(o => o._id === res.data._id);
            console.log(`   Updated Status: ${updatedOrder ? updatedOrder.status : 'Unknown'}`);
        }
    } catch (e) {
        console.error('❌ Limit Buy Failed:', e.response ? e.response.data : e.message);
    }

    // 5. Fetch Portfolio
    console.log('\n💼 5. Verifying Portfolio & Holdings...');
    try {
        const res = await axios.get(`${BASE_URL}/holdings`, authConfig);
        console.table(res.data.map(h => ({
            Stock: h.stock,
            Qty: h.quantity,
            AvgPrice: h.avgPrice.toFixed(2),
            IsShort: h.isShort || false
        })));
    } catch (e) {
        console.error('❌ Fetch Holdings Failed:', e.response ? e.response.data : e.message);
    }
    
    console.log('\n✅ TEST SUITE COMPLETED');
}

runTests();
