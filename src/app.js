const connectDB = require('./config/db');
const { getTokensWithBoostsOverThreshold } = require('./services/boostService');
// const { getNewTokens } = require('./services/newTokenService');
const { sendTokenBoostMessage, sendNewTokenMessage } = require('./services/tokenService');
const User = require('./models/userModel');
const Token = require('./models/tokenModel');
const { logger } = require('./utils/logger');
// const Token = require('./models/tokenModel'); // Adjust the path according to your file structure
const bot = require('./bot/telegramBot'); // Import the bot instance
const { MongoClient } = require('mongodb');
const cron = require('node-cron');


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
const BOOST_CHECK_INTERVAL = 60 * 1000; // Check boosts every 60 seconds

// Connect to database
connectDB();

// Function to monitor boosts over threshold
const monitorBoostsOverThreshold = async () => {
    setInterval(async () => {
        const tokens = await getTokensWithBoostsOverThreshold();
        const subscribedUsers = await User.find({ isSubscribed: true, isBlocked: false });

        for (const token of tokens) {
            for (const user of subscribedUsers) {
                await sendTokenBoostMessage(user, token);
            }
        }
    }, BOOST_CHECK_INTERVAL);
};

// Function to get new tokens
// const monitorNewTokens = async () => {
//     setInterval(async () => {
//         const tokens = await getNewTokens();
//         const adminUsers = await User.find({ isAdmin: true });

//         for (const token of tokens) {
//             for (const user of adminUsers) {
//                 await sendNewTokenMessage(user, token);
//             }
//         }
//     }, BOOST_CHECK_INTERVAL);
// };

// Start monitoring
monitorBoostsOverThreshold();
// deleteAllTokens();
// deleteAllUsers();



async function cleanTokensReceived() {    
    const client = new MongoClient(process.env.MONGO_URI);
        
    try {
        await client.connect();
        const db = client.db("test"); // Replace with your database name
        const usersCollection = db.collection("users");

        // Find all users
        const users = await usersCollection.find({}).toArray();

        for (const user of users) {
            const tokens = user.tokensReceived || [];
            console.log(user.username)
            // Only proceed if there are more than 20 tokens
            if (tokens.length > 20) {
                // Keep only the last 20 tokens
                const tokensToKeep = tokens.slice(-20);

                // Update the user's tokensReceived field
                await usersCollection.updateOne(
                    { _id: user._id },
                    { $set: { tokensReceived: tokensToKeep } }
                );
            }
        }

        console.log("Tokens cleaned up for all users.");
    } catch (error) {
        console.error("Error cleaning tokens:", error);
    } finally {
        await client.close();
    }
}

// Schedule the cleanup to run every 2 days at midnight
cron.schedule('0 0 */2 * *', () => {
    console.log("Running scheduled cleanup...");
    cleanTokensReceived();
  });
  
