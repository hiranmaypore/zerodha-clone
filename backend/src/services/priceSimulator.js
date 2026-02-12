const randomWalk = require("../utils/randomWalk");

let prices = {};

function startSimulation(io) {
  setInterval(() => {
    for (let symbol in prices) {
      prices[symbol] = randomWalk(prices[symbol]);
    }

    io.emit("price_update", prices);
  }, 1000);
}

function setInitialPrices(initialPrices) {
  prices = initialPrices;
}

function getPrices() {
  return prices;
}

module.exports = {
  startSimulation,
  setInitialPrices,
  getPrices
};
