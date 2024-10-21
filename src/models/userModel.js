const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    username: { type: String},
    isSubscribed: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    tokensReceived: [{
        tokenAddress: String,
        boostAmount: Number,
        name: String,
        symbol: String,
        marketCap: Number,
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
    }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
