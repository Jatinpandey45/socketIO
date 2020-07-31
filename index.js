const app = require("express")();
const http = require("http").createServer(app);
var io = require("socket.io")(http);
const mongoose = require("./config/database");
const Location = require("./models/location");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  socket.on("setlocation", data => {
    console.log(data);

    var locationData = JSON.parse(data);

    if (typeof locationData != "undefined") {
      location = new Location(locationData);
      location
        .save(locationData)
        .then(data => {
          socket.emit("getlocation", data);
          console.log(data);
        })
        .catch(erro => {
          throw erro;
        });
    }
  });

  socket.on("getlocation", data => {
    var userData = JSON.parse(data);

    if (typeof userData != "undefined") {
      var token = userData.token;
      var finalResutl = [];
      Location.find({ token: token })
        .sort({ _id: -1 })
        .then(result => {
          socket.emit("getlocation", result);
        })
        .catch(erro => {
          throw new Error("Something went wrong");
        });
    }
  });

  io.on("disconnect", () => {
    console.log("socket disconnected");
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
