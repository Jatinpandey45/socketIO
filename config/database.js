const mongoose = require('mongoose');


module.exports  = mongoose.connect('mongodb://mv_mongoAdmin:marvellapp123W%40@52.33.101.147:27017/marvelldb?authSource=admin', {useNewUrlParser: true,useUnifiedTopology: true});