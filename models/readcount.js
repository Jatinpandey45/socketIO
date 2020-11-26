const mongoose = require('mongoose');

const readcountSchema = new mongoose.Schema({
    user_id:Number,
    count:{
        type:Number,
        default:0
    }
});

module.exports = mongoose.model('readcount',readcountSchema);