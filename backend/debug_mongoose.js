const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = `debug${Date.now()}@test.com`;
        console.log(`Creating user with email: ${email}`);

        const user = new User({
            name: "Debug User",
            email: email,
            password: "password123",
            balance: 100000
        });

        console.log('Saving user...');
        await user.save();
        console.log('User saved successfully:', user._id);

        await mongoose.disconnect();
    } catch (error) {
        console.error('ERROR:', error);
        console.error('STACK:', error.stack);
    }
};

run();
