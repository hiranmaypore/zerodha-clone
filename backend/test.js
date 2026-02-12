const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let token = '';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
    try {
        console.log('--- STARTING BACKEND TESTS ---');

        // 1. Signup
        console.log('\n1. Testing Signup...');
        try {
            const res = await axios.post(`${BASE_URL}/auth/signup`, {
                name: "Test Trader",
                email: `test${Date.now()}@example.com`,
                password: "password123"
            });
            token = res.data.token;
            console.log('✅ Signup Successful. Wallet:', res.data.balance);
        } catch (e) {
            console.error('❌ Signup Failed:', e.message);
            if (e.response) {
                console.error('Response Data:', e.response.data);
                console.error('Response Status:', e.response.status);
            }
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 2. Buy Market Order
        console.log('\n2. Testing Buy MARKET Order (TCS)...');
        try {
            const res = await axios.post(`${BASE_URL}/orders/buy`, {
                stockSymbol: "TCS",
                quantity: 10,
                orderType: "MARKET"
            }, config);
            console.log('✅ Market Buy Executed. Status:', res.data.status);
        } catch (e) {
            console.error('❌ Market Buy Failed:', e.response?.data || e.message);
        }

        // 3. Short Sell (Market)
        console.log('\n3. Testing Short Sell MARKET Order (INFY) - Selling what we don\'t have...');
        try {
            const res = await axios.post(`${BASE_URL}/orders/sell`, {
                stockSymbol: "INFY",
                quantity: 5,
                orderType: "MARKET"
            }, config);
            console.log('✅ Short Sell Executed. Status:', res.data.status);
        } catch (e) {
            console.error('❌ Short Sell Failed:', e.response?.data || e.message);
        }

        // 4. Limit Buy Order (Should be PENDING)
        console.log('\n4. Testing Limit Buy (RELIANCE @ 100)...');
        try {
            const res = await axios.post(`${BASE_URL}/orders/buy`, {
                stockSymbol: "RELIANCE",
                quantity: 5,
                orderType: "LIMIT",
                limitPrice: 100 // Very low price, should stay PENDING
            }, config);
            console.log('✅ Limit Order Placed. Status:', res.data.status);
        } catch (e) {
            console.error('❌ Limit Buy Failed:', e.response?.data || e.message);
        }

        // 5. Check Holdings
        console.log('\n5. Checking Portfolio...');
        try {
            const res = await axios.get(`${BASE_URL}/holdings`, config);
            console.log('✅ Holdings fetched:', res.data);
            const shortHolding = res.data.find(h => h.stock === 'INFY');
            if(shortHolding && shortHolding.quantity < 0) console.log('✅ Short Position Verified (Negative Quantity).');
        } catch (e) {
            console.error('❌ Fetch Holdings Failed:', e.response?.data || e.message);
        }

        console.log('\n--- TESTS COMPLETED ---');

    } catch (error) {
        console.error('Test Suite Error:', error.message);
    }
}

runTests();
