const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    token:Number,
    geolocation:{
        lat:Number,
        long:Number,
        formatted_address:String,
        pincode:Number
    }
});

module.exports = mongoose.model('location',LocationSchema);