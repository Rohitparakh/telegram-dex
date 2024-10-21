const User = require('../models/userModel');

// Subscribe user
const subscribeUser = async (chatId,username) => {
    let user = await User.findOne({ chatId });
    if (!user) {
        user = new User({ chatId, username });
        await user.save();
    } else if(user && !user.isSubscribed){
        user.isSubscribed = true;
        await user.save();
    }
    return user;
};

// Unsubscribe user
const unsubscribeUser = async (chatId) => {
    const user = await User.findOne({ chatId });
    if (user && user.isSubscribed) {
        user.isSubscribed = false;
        await user.save();
    }
    return user;
};

module.exports = {
    subscribeUser,
    unsubscribeUser
};
