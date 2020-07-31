const mongoose = require('mongoose');

module.exports  = mongoose.connect('mongodb://localhost/marvell', {useNewUrlParser: true,useUnifiedTopology: true});