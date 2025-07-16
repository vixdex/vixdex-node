var mongoose = require("mongoose")

var priceSchema = new mongoose.Schema({
    poolAddress:{
        type:String,
        required:true
    },

    chart:{
        type:[{
            time: Number,
            price0: Number,
            price1: Number,
            iv:Number,
        }],
        required:true
    }
})

module.exports = mongoose.model("PriceSchema", priceSchema)