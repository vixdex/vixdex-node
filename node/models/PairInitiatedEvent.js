const mongoose = require('mongoose');

const pairInitiatedEventSchema = new mongoose.Schema({
  deriveToken: { type: String, required: true, index: true },
  vixHighToken: { type: String, required: true },
  vixLowToken: { type: String, required: true },
  initiatedTime: { type: Date, required: true },
  initiatedIV: { type: Number, required: true },
  blockNumber: { type: Number, required: true, index: true },
  transactionHash: { type: String, required: true, unique: true }
}, { timestamps: true });

// Create index for faster queries
pairInitiatedEventSchema.index({ blockNumber: -1, transactionHash: 1 });

module.exports = mongoose.models.PairInitiatedEvent || 
  mongoose.model('PairInitiatedEvent', pairInitiatedEventSchema);
