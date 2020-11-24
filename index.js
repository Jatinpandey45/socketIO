var app = require('express')();
var fs = require('fs');
var https        = require('https');
var server = https.createServer({
    key: fs.readFileSync('./key.key'),
    cert: fs.readFileSync('./cert.crt'),
    ca: fs.readFileSync('./ca.crt'),
    requestCert: false,
    rejectUnauthorized: false
},app);

var io = require("socket.io")(server,{ origins: '*:*'});
const mongoose = require("./config/database");
const MessageModel = require("./models/message");
const online = require('./models/online');

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", socket => {

  socket.emit('connected');

  socket.on("sendmessage", data => {
   
    var messageData = JSON.parse(data);

    if (typeof messageData != "undefined") {
      console.log(messageData);
      message = new MessageModel(messageData);
      message
        .save(messageData)
        .then(data => {
          socket.broadcast.emit('receivemessage',data);
        })
        .catch(erro => {
          throw erro;
        });
    }
  });


socket.on('online',data => {

  var userData = JSON.parse(data);

  var options = { upsert: true, useFindAndModify: false};

  if(typeof userData != "undefined") {

    var id = userData.user_id;

    socket.user_id = id;

    var update = {status:'online'};


    online.findOneAndUpdate({user_id:id},update,options,function(error,result){
          if (!error) {
            // If the document doesn't exist
            if (!result) {
                // Create it
                result = new online();
            }
            // Save the document
            result.save(function(error) {
                if (!error) {
                    // Do something with the document
                } else {
                    throw error;
                }
            });
        }
    })

  }

});

// socket check online status or offline status.

socket.on('isonline',data => {

  var userData = JSON.parse(data);

  if(typeof userData != "undefined") {

    var userId = userData.user_id;

    if(UserId) {

      online.findOne({user_id:userId})
      
      .sort({_id:-1})
      
      .then(data =>  {

        socket.emit('onlinestatus',data);

      }).catch(err => {
        throw err
      });

    }

  }

});


socket.on("loadgroupmessage", data => {
  var userData = JSON.parse(data);

  if(typeof userData != "undefined") {

    grouIds = userData.groupIds;

    console.log(grouIds);

    if(grouIds) {

    MessageModel.aggregate([
      {
        $match:{
          group_id:{
                $in:grouIds
            }
        }
      }
  ])

    .group(
      {
      _id:"$group_id",
      send_profile_image:{$first:"$send_profile_image"},
      group_id:{$first:"$group_id"},
      group_name:{$first:"$group_name"},
      group_members:{$first:"$group_members"},
      unread_members:{$first:"$unread_members"},
      media_url:{$first:"$media_url"},
      emoji:{$first:"$emoji"},
      to_user_id:{$first:"$to_user_id"},
      to_user_name:{$first:"$to_user_name"},
      from_user_id:{$first:"$from_user_id"},
      from_user_name:{$first:"$from_user_name"},
      is_read:{$first:"$is_read"},
      message:{$first:"$message"},
      time:{$first:"$time"},
      created:{$first:"$created"}
    })

    .sort({_id:-1})

    .limit(10)

    .then(data => {
      console.log(data);
      socket.emit('loadinitgroupmessage',data);

    }).catch(err => {
      throw err;
    })

    }

  }

});


socket.on("loadmessage", data => {
  var userData = JSON.parse(data);

  if(typeof userData != "undefined") {

    userId = userData.userId;

    if(userId) {

    MessageModel.aggregate([
      {
        $match:{
          unread_members:{
                $in:[userId]
            }
        }
      }
  ])

    .group(
      {
      _id:"$group_id",
      send_profile_image:{$first:"$send_profile_image"},
      group_id:{$first:"$group_id"},
      group_name:{$first:"$group_name"},
      group_members:{$first:"$group_members"},
      unread_members:{$first:"$unread_members"},
      media_url:{$first:"$media_url"},
      emoji:{$first:"$emoji"},
      to_user_id:{$first:"$to_user_id"},
      to_user_name:{$first:"$to_user_name"},
      from_user_id:{$first:"$from_user_id"},
      from_user_name:{$first:"$from_user_name"},
      is_read:{$first:"$is_read"},
      message:{$first:"$message"},
      time:{$first:"$time"},
      created:{$first:"$created"}
    })
    
    .sort({_id:-1})

    .limit(10)

    .then(data => {
      console.log(data);
      socket.emit('initmessage',data);

    }).catch(err => {
      throw err;
    })

    }

  }

});


// send message by specific group.

socket.on('getgroupmessages',data => {


  var userData = JSON.parse(data);

  if(typeof userData != "undefined") {

    groupId = userData.groupId;


    if(groupId) {

    MessageModel.find({group_id:groupId})

    .limit(20)

    .then(data => {
      console.log(data);
      socket.emit('groupmessages',data);

    }).catch(err => {
      throw err;
    })

    }

  }

});

  socket.on('updatereceived',data => {

    var messageData = JSON.parse(data);

    if(messageData.id && messageData.unread_members) {


      MessageModel.updateOne({_id:messageData.id},{$set:{
        unread_members:messageData.unread_members
      }})
      
      .exec()

      .then(data => {

        socket.emit('receivemessageupdated',data);

      }).catch(err => {
        throw err;
      });

    }

  });

  socket.on('disconnect',(data) => {
    console.log(data);
    var options = { upsert: true, useFindAndModify: false};

    var id =  socket.user_id 

    console.log("id-->",id);

    if(typeof id != "undefined") {

      console.log("Hello");

      var update = {status:'offline'};

      online.findOneAndUpdate({user_id:id},update,options,function(error,result){
            if (!error) {
              // If the document doesn't exist
              if (!result) {
                  // Create it
                 
              }
              // Save the document
              result.save(function(error) {
                  if (!error) {
                      // Do something with the document
                  } else {
                      throw error;
                  }
              });
          }
      })

    }

});




});



server.listen(3000, () => {
  console.log("listening on *:3000");
});
