var mongoose = require('mongoose');
var uniswapV3PoolVolumeSchema = new mongoose.Schema({
    poolAddress: {
        type: String,
        required: true,
        unique: true
    },
    chain: {
        type: String,
        required: true
    },
    volume: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: new Date(Date.now() + 24 * 60 * 60 * 1000)// Default to 24 hours from now
    }
})

module.exports = mongoose.model('UniswapV3PoolVolume', uniswapV3PoolVolumeSchema);