const connectDB = require('./config/db');
const { getTokensWithBoostsOverThreshold } = require('./services/boostService');
const { sendTokenBoostMessage } = require('./services/tokenService');
const User = require('./models/userModel');
const Token = require('./models/tokenModel');
const { logger } = require('./utils/logger');
// const Token = require('./models/tokenModel'); // Adjust the path according to your file structure
const bot = require('./bot/telegramBot'); // Import the bot instance

async function deleteAllUsers() {
    try {
        await User.deleteMany({});
        console.log('All users have been deleted successfully.');
    } catch (error) {
        console.error('Error deleting users:', error);
        throw error; // Rethrow the error for further handling if needed
    }
}
async function deleteAllTokens() {
    try {
        await Token.deleteMany({});
        console.log('All tokens have been deleted successfully.');
    } catch (error) {
        console.error('Error deleting tokens:', error);
        throw error; // Rethrow the error for further handling if needed
    }
}

// Constants
const BOOST_CHECK_INTERVAL = 10 * 1000; // Check boosts every 10 seconds

// Connect to database
connectDB();

// Function to monitor boosts over threshold
const monitorBoostsOverThreshold = async () => {
    setInterval(async () => {
        const tokens = await getTokensWithBoostsOverThreshold();
        const subscribedUsers = await User.find({ isSubscribed: true });

        for (const token of tokens) {
            for (const user of subscribedUsers) {
                await sendTokenBoostMessage(user, token);
            }
        }
    }, BOOST_CHECK_INTERVAL);
};

// Start monitoring
monitorBoostsOverThreshold();
// deleteAllTokens();
// deleteAllUsers();
