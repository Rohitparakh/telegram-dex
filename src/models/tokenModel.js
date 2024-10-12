const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    name: { type: String },
    symbol: { type: String },
    marketCap: { type: Number },
    websites: [
        {
            label: { type: String },
            url: { type: String }
        }
    ],
    socials: [
        {
            type: { type: String },
            url: { type: String }
        }
    ],
    tokenAddress: { type: String, required: true, unique: true }, // Unique token address
    boostAmount: { type: Number, required: true },              // Amount of boosts
    firstFetchedAt: { type: Date, default: Date.now },          // Date when the token was first fetched
    boosts: { type: Number }                         // Default boosts count
});

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
