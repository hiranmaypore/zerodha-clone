const randomWalk = require("../utils/randomWalk");

let prices = {};
let openingPrices = {};

function startSimulation(io) {
  setInterval(() => {
    const updatedPrices = {};
    for (let symbol in prices) {
      const oldPrice = prices[symbol];
      prices[symbol] = randomWalk(oldPrice);
      updatedPrices[symbol] = prices[symbol];

      // Emit to specific symbol rooms for clients subscribed to these stocks
      io.to(`stock:${symbol}`).emit('price_update', { [symbol]: prices[symbol] });
    }

    // Still broadcast full map for legacy components/initial state
    // but at a slower frequency or only for active symbols
    io.emit("price_update", prices);
  }, 1000);
}


function setInitialPrices(initialPrices) {
  prices = { ...initialPrices };
  openingPrices = { ...initialPrices }; // Set baseline for "Day Change"
}

function getPrices() {
  return prices;
}

function getOpeningPrices() {
  return openingPrices;
}

module.exports = {
  startSimulation,
  setInitialPrices,
  getPrices,
  getOpeningPrices
};

