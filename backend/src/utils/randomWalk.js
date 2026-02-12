function randomWalk(price) {
  const changePercent = (Math.random() - 0.5) * 0.01; // ±0.5%
  const newPrice = price + price * changePercent;
  return parseFloat(newPrice.toFixed(2));
}

module.exports = randomWalk;
