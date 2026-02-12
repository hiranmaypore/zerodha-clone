function priceSocket(io, getPrices) {
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.emit("price_update", getPrices());

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = priceSocket;
