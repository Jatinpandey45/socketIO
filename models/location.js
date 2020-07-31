const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
    token:String,
    geolocation:{
        lat:Number,
        long:Number,
        formatted_address:String,
        pincode:Number
    },
    created:String
});

module.exports = mongoose.model('location',LocationSchema);