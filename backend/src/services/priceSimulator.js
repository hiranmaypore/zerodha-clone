const randomWalk = require("../utils/randomWalk");

let prices = {};
let openingPrices = {};

function startSimulation(io) {
  setInterval(() => {
    for (let symbol in prices) {
      prices[symbol] = randomWalk(prices[symbol]);
    }

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

