const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    to_user_id:Number,
    to_user_name:String,
    from_user_id:Number,
    from_user_name:String,
    send_profile_image:{
      type:String,
      default:null,
    },
    is_read:{
      type:String,
      enum:['unread','read'],
      required:true
    },
    group_id:{
      type:Number,
      default:null,
      required:false
    },
    group_name:String,
    group_members:[{
      type:String
    }],
    message:String,
    media_url:{
      type:String,
      default:null,
      required:false
    },
    emoji:{
      type:String,
      default:null,
      required:false
    },
    time:String,
    created:String
});

module.exports = mongoose.model('message',messageSchema);