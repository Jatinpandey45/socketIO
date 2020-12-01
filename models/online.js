const mongoose = require('mongoose');

const onlineSchema = new mongoose.Schema({
    user_id:Number,
    status:{
        type:String,
        enum:['online','offline']
    }
});

module.exports = mongoose.model('online',onlineSchema);