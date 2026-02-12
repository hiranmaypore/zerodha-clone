const axios = require("axios");

const API_KEY = process.env.ALPHA_VANTAGE_KEY;

async function fetchStockPrice(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const response = await axios.get(url);

    const price = parseFloat(
      response.data["Global Quote"]["05. price"]
    );

    return price;
  } catch (error) {
    console.error(`API failed for ${symbol}`);
    return null;
  }
}

module.exports = fetchStockPrice;
