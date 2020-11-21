const mongoose = require('mongoose');

const onlineSchema = new mongoose.Schema({
    user_id:Number,
    group_id:{
        type:Number,
        default:null
    },
    status:{
        type:String,
        enum:['online','offline']
    }
});

module.exports = mongoose.model('online',onlineSchema);