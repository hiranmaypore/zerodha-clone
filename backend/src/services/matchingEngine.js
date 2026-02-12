const Order = require('../models/Order');
const Holding = require('../models/Holding');
const User = require('../models/User');
const { getPrices } = require('./priceSimulator');
const { notifyOrderExecuted, notifyStopLossTriggered, notifyBracketEntry } = require('./orderNotifications');

// Runs continually to match PENDING orders
const startMatchingEngine = () => {
    console.log("Matching Engine Started...");
    
    setInterval(async () => {
        try {
            const prices = getPrices();
            if (!prices) return;

            // Find all PENDING orders
            const pendingOrders = await Order.find({ status: 'PENDING' });

            for (const order of pendingOrders) {
                const currentPrice = prices[order.stock];
                
                if (!currentPrice) continue;

                let executed = false;

                // === STOP-LOSS ORDER LOGIC ===
                if (order.orderCategory === 'STOPLOSS' && order.type === 'SELL') {
                    // Trigger when price drops to or below stop-loss price
                    if (currentPrice <= order.stopLossPrice) {
                        executed = true;
                        
                        // Execute as MARKET sell
                        const totalRevenue = currentPrice * order.quantity;
                        const user = await User.findById(order.user);
                        user.balance += totalRevenue;
                        await user.save();
                        
                        console.log(`⚠️  Stop-Loss Triggered: ${order.stock} @ ${currentPrice} (trigger: ${order.stopLossPrice})`);
                        await notifyStopLossTriggered(order, currentPrice);
                    }
                }

                // === BRACKET ORDER LOGIC ===
                else if (order.orderCategory === 'BRACKET' && order.type === 'BUY') {
                    // Entry order - execute when price reaches entry (limit) price
                    if (currentPrice <= order.limitPrice) {
                        executed = true;
                        
                        // Refund if executed cheaper
                        const refundAmount = (order.limitPrice - currentPrice) * order.quantity;
                        if (refundAmount > 0) {
                            const user = await User.findById(order.user);
                            user.balance += refundAmount;
                            await user.save();
                        }

                        // Add Holdings
                        let holding = await Holding.findOne({ user: order.user, stock: order.stock });
                        if (holding) {
                            const oldTotalValue = holding.quantity * holding.avgPrice;
                            const newTotalValue = oldTotalValue + (currentPrice * order.quantity);
                            const newQuantity = holding.quantity + order.quantity;
                            holding.avgPrice = newTotalValue / newQuantity;
                            holding.quantity = newQuantity;
                            await holding.save();
                        } else {
                            await Holding.create({
                                user: order.user,
                                stock: order.stock,
                                quantity: order.quantity,
                                avgPrice: currentPrice
                            });
                        }

                        // Create TARGET and STOP-LOSS leg orders
                        await Order.create({
                            user: order.user,
                            stock: order.stock,
                            type: 'SELL',
                            orderType: 'LIMIT',
                            limitPrice: order.targetPrice,
                            quantity: order.quantity,
                            price: order.targetPrice,
                            status: 'PENDING',
                            parentOrderId: order._id
                        });

                        await Order.create({
                            user: order.user,
                            stock: order.stock,
                            type: 'SELL',
                            orderType: 'MARKET',
                            orderCategory: 'STOPLOSS',
                            stopLossPrice: order.stopLossPrice,
                            quantity: order.quantity,
                            price: order.stopLossPrice,
                            status: 'PENDING',
                            parentOrderId: order._id
                        });

                        console.log(`📊 Bracket Entry Executed: ${order.stock} @ ${currentPrice}`);
                        await notifyBracketEntry(order, currentPrice);
                    }
                }

                // === REGULAR LIMIT ORDER LOGIC ===
                else if (order.orderCategory === 'REGULAR' || !order.orderCategory) {
                    if (order.type === 'BUY' && currentPrice <= order.limitPrice) {
                        // BUY LIMIT EXECUTED
                        // Funds were already blocked. We just need to grant holdings and refund difference.
                        executed = true;
                        
                        // Refund if executed cheaper than limit
                        const refundAmount = (order.limitPrice - currentPrice) * order.quantity;
                        if (refundAmount > 0) {
                            const user = await User.findById(order.user);
                            user.balance += refundAmount;
                            await user.save();
                        }

                        // Add/Update Holdings (Handles Short Cover as well)
                        let holding = await Holding.findOne({ user: order.user, stock: order.stock });
                        if (holding) {
                            const newQuantity = holding.quantity + order.quantity;

                            if (holding.isShort) {
                                // COVERING SHORT POSITION
                                 // Logic: Buying back. 
                                 // If completely covered (qty >= 0), isShort becomes false.
                                 if (newQuantity >= 0) {
                                     holding.isShort = false;
                                 }
                                 // Avg Price calculation for Short Cover is tricky. 
                                 // Real P&L is realized here. But for simplicity, we just adjust quantity.
                                 holding.quantity = newQuantity;
                            } else {
                                // Standard Buy Averaging
                                const oldTotalValue = holding.quantity * holding.avgPrice;
                                const newTotalValue = oldTotalValue + (currentPrice * order.quantity); 
                                holding.avgPrice = newTotalValue / newQuantity;
                                holding.quantity = newQuantity;
                            }

                            if (holding.quantity === 0 && !holding.isShort) {
                                 await Holding.deleteOne({ _id: holding._id });
                            } else {
                                await holding.save();
                            }

                        } else {
                            holding = await Holding.create({
                                user: order.user,
                                stock: order.stock,
                                quantity: order.quantity,
                                avgPrice: currentPrice
                            });
                        }

                    } else if (order.type === 'SELL' && currentPrice >= order.limitPrice) {
                        // SELL LIMIT EXECUTED
                        // Stocks were already blocked (deducted). We just need to grant funds.
                        executed = true;

                        const totalRevenue = currentPrice * order.quantity;
                        const user = await User.findById(order.user);
                        user.balance += totalRevenue;
                        await user.save();
                        
                        // If this is a bracket leg, cancel the other leg
                        if (order.parentOrderId) {
                            await Order.updateMany(
                                { 
                                    parentOrderId: order.parentOrderId,
                                    _id: { $ne: order._id },
                                    status: 'PENDING'
                                },
                                { 
                                    status: 'CANCELLED',
                                    cancelReason: 'Other bracket leg executed'
                                }
                            );
                        }
                    }
                }

                if (executed) {
                    order.status = 'COMPLETED';
                    order.price = currentPrice; // Record actual execution price
                    await order.save();
                    await notifyOrderExecuted(order);
                    console.log(`Order Executed: ${order._id} | ${order.type} ${order.stock} @ ${currentPrice}`);
                }
            }
        } catch (error) {
            console.error("Matching engine error:", error);
        }
    }, 1000); // Check every second
};

module.exports = startMatchingEngine;
