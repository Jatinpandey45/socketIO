const app = require("express")();
const http = require("http").createServer(app);
var io = require("socket.io")(http);
const mongoose = require("./config/database");
const Location = require("./models/location");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  socket.on("location", data => {
    console.log(data);

    var locationData = JSON.parse(data);

    if (typeof locationData != "undefined") {
      location = new Location(locationData);
      location
        .save(locationData)
        .then(data => {
          console.log(data);
        })
        .catch(erro => {
          throw erro;
        });
      socket.broadcast.emit("location", data);
    }
  });

  io.on("disconnect", () => {
    console.log("socket disconnected");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
