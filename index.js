var app = require("express")();
var fs = require("fs");
var https = require("https");
var server = https.createServer(
  {
    key: fs.readFileSync("./key.key"),
    cert: fs.readFileSync("./cert.crt"),
    ca: fs.readFileSync("./ca.crt"),
    requestCert: false,
    rejectUnauthorized: false
  },
  app
);

var io = require("socket.io")(server, { origins: "*:*" });
const mongoose = require("./config/database");
const MessageModel = require("./models/message");
const online = require("./models/online");
const readcount = require("./models/readcount");

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {
  socket.emit("connected");

  socket.on("sendmessage", data => {
    var messageData = JSON.parse(data);

    if (typeof messageData != "undefined") {
      console.log(messageData);
      message = new MessageModel(messageData);
      message
        .save(messageData)
        .then(data => {
          socket.broadcast.emit("receivemessage", data);
        })
        .catch(erro => {
          throw erro;
        });
    }
  });

  socket.on("online", data => {
    var userData = JSON.parse(data);

    var options = { upsert: true, useFindAndModify: false };

    if (typeof userData != "undefined") {
      var id = userData.user_id;

      socket.user_id = id;

      online
        .findOne({ user_id: id })

        .exec()

        .then(finalResult => {
          if (finalResult) {
            online
              .update(
                { user_id: id },
                {
                  $set: {
                    status: "online"
                  }
                }
              )

              .exec()

              .then(result => {
                socket.broadcast.emit("onlinestatus", {
                  user_id: id,
                  status: "online"
                });
              });
          } else {
            // create new record

            var newStatus = new online({
              user_id: id,
              status: "online"
            });

            newStatus

              .save(newData => {
                socket.broadcast.emit("onlinestatus", newData);
              })
              .catch(err => {
                throw err;
              });
          }
        })
        .catch(err => {
          throw err;
        });
    }
  });

  // socket check online status or offline status.

  socket.on("isonline", data => {
    var userData = JSON.parse(data);

    console.log(userData);

    if (typeof userData != "undefined") {
      var userId = userData.user_id;

      if (userId) {
        online
          .findOne({ user_id: userId })

          .sort({ _id: -1 })

          .then(data => {
            socket.emit("knowstatus", {
              status: data,
              message: userData.message
            });
          })
          .catch(err => {
            throw err;
          });
      }
    }
  });

  socket.on("loadgroupmessage", data => {
    var userData = JSON.parse(data);

    if (typeof userData != "undefined") {
      grouIds = userData.groupIds;

      console.log(grouIds);

      if (grouIds) {
        MessageModel.aggregate([
          {
            $match: {
              group_id: {
                $in: grouIds
              }
            }
          }
        ])

          .group({
            _id: "$group_id",
            send_profile_image: { $first: "$send_profile_image" },
            group_id: { $first: "$group_id" },
            group_name: { $first: "$group_name" },
            group_members: { $first: "$group_members" },
            group_image: { $first: "$group_image" },
            unread_members: { $first: "$unread_members" },
            media_url: { $first: "$media_url" },
            emoji: { $first: "$emoji" },
            to_user_id: { $first: "$to_user_id" },
            to_user_name: { $first: "$to_user_name" },
            from_user_id: { $first: "$from_user_id" },
            from_user_name: { $first: "$from_user_name" },
            is_read: { $first: "$is_read" },
            message: { $first: "$message" },
            time: { $first: "$time" },
            created: { $first: "$created" }
          })

          .sort({ _id: -1 })

          .limit(10)

          .then(data => {
            console.log(data);
            socket.emit("loadinitgroupmessage", data);
          })
          .catch(err => {
            throw err;
          });
      }
    }
  });

  // update group name and image.

  socket.on("updategroupsetting", data => {
    var userData = JSON.parse(data);

    if (userData.group_id && userData.group_image && userData.group_name) {
      var id = userData.group_id;

      MessageModel.update(
        { group_id: id },
        {
          $set: {
            group_name: userData.group_name,
            group_image: userData.group_image
          }
        }
      )

        .exec()

        .then(result => {
          socket.emit("groupsettingupdated", result);
        })
        .catch(err => {
          throw err;
        });
    }
  });

  socket.on("loadmessage", data => {
    var userData = JSON.parse(data);

    if (typeof userData != "undefined") {
      userId = userData.userId;

      if (userId) {
        MessageModel.aggregate([
          {
            $match: {
              unread_members: {
                $in: [userId]
              },

              read_members: {
                $nin: [userId]
              }
            }
          }
        ])

          .group({
            _id: "$group_id",
            send_profile_image: { $first: "$send_profile_image" },
            group_id: { $first: "$group_id" },
            group_name: { $first: "$group_name" },
            group_members: { $first: "$group_members" },
            group_image: { $first: "$group_image" },
            unread_members: { $first: "$unread_members" },
            read_members: { $first: "$read_members" },
            media_url: { $first: "$media_url" },
            emoji: { $first: "$emoji" },
            to_user_id: { $first: "$to_user_id" },
            to_user_name: { $first: "$to_user_name" },
            from_user_id: { $first: "$from_user_id" },
            from_user_name: { $first: "$from_user_name" },
            is_read: { $first: "$is_read" },
            message: { $first: "$message" },
            time: { $first: "$time" },
            created: { $first: "$created" }
          })

          .sort({ _id: -1 })

          .limit(10)

          .then(data => {
            console.log(data);
            socket.emit("initmessage", data);
          })
          .catch(err => {
            throw err;
          });
      }
    }
  });

  // search user group

  socket.on("searchmessage", data => {
    var decodeData = JSON.parse(data);
    var searchTerm = decodeData.searchTerm;

    if (searchTerm) {
      MessageModel.find({
        message: {
          $regex: searchTerm,
          $options: "i"
        }
      })

        .sort({ _id: -1 })

        .limit(10)

        .exec()

        .then(data => {
          socket.emit("receivesearchmessage", data);
        })

        .catch(err => {
          throw err;
        });
    }
  });

  // send message by specific group.

  socket.on("getgroupmessages", data => {
    var userData = JSON.parse(data);

    if (typeof userData != "undefined") {
      groupId = userData.groupId;

      if (groupId) {
        MessageModel.find({ group_id: groupId })

          .limit(20)

          .then(data => {
            console.log(data);
            socket.emit("groupmessages", data);
          })
          .catch(err => {
            throw err;
          });
      }
    }
  });

  socket.on("updatereceived", data => {
    var messageData = JSON.parse(data);

    if (messageData.id && messageData.unread_members) {
      MessageModel.updateOne(
        { _id: messageData.id },
        {
          $set: {
            unread_members: messageData.unread_members,
            read_members: messageData.read_members
          }
        }
      )

        .exec()

        .then(data => {
          socket.emit("receivemessageupdated", data);
        })
        .catch(err => {
          throw err;
        });
    }
  });

  socket.on("usertyping", data => {
    var messageData = JSON.parse(data);
    if (messageData.user != "undefined") {
      socket.broadcast.emit("receivetyping", messageData);
    }
  });

  socket.on("getmyreadmessage", data => {
    var userData = JSON.parse(data);

    if (userData.user.user_id) {
      var userId = userData.user.user_id;

      MessageModel.aggregate([
        {
          $match: {
            read_members: {
              $in: [userId]
            }
          }
        }
      ])

        .group({
          _id: "$group_id",
          send_profile_image: { $first: "$send_profile_image" },
          group_id: { $first: "$group_id" },
          group_name: { $first: "$group_name" },
          group_members: { $first: "$group_members" },
          group_image: { $first: "$group_image" },
          unread_members: { $first: "$unread_members" },
          read_members: { $first: "$read_members" },
          media_url: { $first: "$media_url" },
          emoji: { $first: "$emoji" },
          to_user_id: { $first: "$to_user_id" },
          to_user_name: { $first: "$to_user_name" },
          from_user_id: { $first: "$from_user_id" },
          from_user_name: { $first: "$from_user_name" },
          is_read: { $first: "$is_read" },
          message: { $first: "$message" },
          time: { $first: "$time" },
          created: { $first: "$created" }
        })

        .sort({ _id: -1 })

        .limit(10)

        .then(data => {
          console.log(data);
          socket.emit("showinitmessage", data);
        })
        .catch(err => {
          throw err;
        });
    }
  });

  socket.on("client_disconnect", data => {
    var messageData = JSON.parse(data);
    var id = messageData.user_id;

    console.log("id-->", id);

    if (typeof id != "undefined") {
      online
        .findOne({ user_id: id })

        .exec()

        .then(finalData => {
          if (finalData) {
            online
              .update(
                { user_id: id },
                {
                  $set: {
                    status: "offline"
                  }
                }
              )

              .exec()

              .then(result => {
                socket.broadcast.emit("onlinestatus", {
                  user_id: id,
                  status: "offline"
                });
              });
          }
        })
        .catch(err => {
          throw err;
        });
    }
  });

  socket.on("disconnect", data => {
    var userId = socket.user_id;
    console.log(socket);
    socket.broadcast.emit("connection_closed", {
      user_id: userId,
      status: "offline"
    });
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
