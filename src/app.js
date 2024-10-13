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

// Start the Telegram bot
// If the bot is set up to listen for messages in telegramBot.js, this will start it.
// bot.on('polling_error', (error) => {
//     console.error(`Polling error: ${error.code} - ${error.message}`);
// });


// Function to monitor boosts over threshold
const monitorBoostsOverThreshold = async () => {
    setInterval(async () => {
        const tokens = await getTokensWithBoostsOverThreshold();
        const subscribedUsers = await User.find({ isSubscribed: true });

        for (const token of tokens) {
            console.log(token.chainId)
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

// const axios = require('axios');
// const TelegramBot = require('node-telegram-bot-api');
// const connectDB = require('./config/db');
// const User = require('./models/userModel');
// const Token = require('./models/tokenModel'); // Adjust the path as needed
// require('dotenv').config();

// // Set the new Dexscreener token boosts API URL
// const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';
// const BOOST_THRESHOLD = 400; // Only show tokens with boosts greater than this value
// const BOOST_CHECK_INTERVAL = 10; // Time interval for polling in seconds
// const BOOST_CHAIN_ID = 'solana';

// // Connect to MongoDB
// connectDB();

// // Create a Telegram bot instance
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// // Debugging log function
// const logger = (message) => {
//     console.log(`[LOG - ${new Date().toISOString()}]: ${message}`);
// };

// // Function to format token address for logging
// const formatTokenAddress = (address) => {
//     return `${address.slice(0, 4)}...${address.slice(-5)}`;
// };

// // Fetch tokens with boosts and filter by boost amount over threshold
// const getTokensWithBoostsOverThreshold = async () => {
//     try {
//         logger(`Fetching token boosts from ${BOOSTS_URL}...`);
//         const response = await axios.get(BOOSTS_URL);

//         if (response.status === 200) {
//             const tokens = response.data;
//             const tokensWithBoosts = tokens.filter(token =>
//                 token.totalAmount >= BOOST_THRESHOLD && token.chainId === BOOST_CHAIN_ID
//             );
//             logger(`${tokensWithBoosts.length} tokens found over the threshold.`);
//             return tokensWithBoosts;
//         } else {
//             logger(`Error fetching data: ${response.status}`);
//             return [];
//         }
//     } catch (error) {
//         logger(`Error occurred: ${error.message}`);
//         return [];
//     }
// };

// // Send notification if new or modified token
// const sendTokenBoostMessage = async (user, token) => {
//     const formattedTokenAddress = formatTokenAddress(token.tokenAddress);
//     logger(token.tokenAddress);

//     // Check if the token has been received before
//     const existingToken = user.tokensReceived.find(t => t.token_address === token.tokenAddress);
//     logger(`Existing token found for user: ${existingToken ? formattedTokenAddress : 'None'}`);

//     let tokenFromDB = await Token.findOne({ tokenAddress: token.tokenAddress });
//     let firstFetchedAt = tokenFromDB ? tokenFromDB.firstFetchedAt : null;

//     // Log token to MongoDB first
//     try {
//         if (tokenFromDB) {
//             // Update if the boost amount has changed
//             if (tokenFromDB.boostAmount !== token.totalAmount) {
//                 tokenFromDB.boostAmount = token.totalAmount;
//                 await tokenFromDB.save();
//             }
//         } else {
//             // Create a new token entry with firstFetchedAt
//             const newToken = new Token({
//                 tokenAddress: token.tokenAddress,
//                 boostAmount: token.totalAmount,
//                 firstFetchedAt: new Date() // Log the first fetched time
//             });
//             await newToken.save();
//             tokenFromDB = newToken; // Use the new token for further operations
//         }
//     } catch (error) {
//         return; // Exit the function if the token logging fails
//     }

//     let message = '';
//     if (!existingToken) {
//         // New token notification
//         message = `
//             *New boost found for ${token.description}:*
//             Token Address: ${token.tokenAddress}
//             Total Boost: ${token.totalAmount}
//             First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}
//             Dexscreener URL: ${token.url}
//         `;
//         user.tokensReceived.push({
//             token_address: token.tokenAddress,
//             boost_amount: token.totalAmount
//         });
//     } else if (existingToken.boost_amount !== token.totalAmount) {
//         // Boost has changed, notify user
//         message = `
//             *Modified boost found for ${token.description}:*
//             Token Address: ${token.tokenAddress}
//             Updated Boost: ${token.totalAmount}
//             Previous Boost: ${existingToken.boost_amount}
//             First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}
//             Dexscreener URL: ${token.url}
//         `;
//         existingToken.boost_amount = token.totalAmount; // Update existing token's boost amount
//     }

//     // Send message to the user if there's a message to send
//     if (message) {
//         try {
//             await bot.sendMessage(user.chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
//             await user.save(); // Save user updates to MongoDB
//         } catch (error) {
//             // Handle errors here
//         }
//     }
// };

// // Monitor token boosts and notify users
// const monitorBoostsOverThreshold = async () => {
//     while (true) {
//         const tokensWithBoosts = await getTokensWithBoostsOverThreshold();

//         // Find subscribed users from MongoDB
//         const subscribedUsers = await User.find({ isSubscribed: true });

//         for (const token of tokensWithBoosts) {
//             for (const user of subscribedUsers) {
//                 await sendTokenBoostMessage(user, token);
//             }
//         }

//         logger(`Next check in ${BOOST_CHECK_INTERVAL} seconds...`);
//         await new Promise(resolve => setTimeout(resolve, BOOST_CHECK_INTERVAL * 1000));
//     }
// };

// // Define userNotifications globally
// const userNotifications = {}; // Object to store user notification subscriptions

// bot.onText(/\/start/, async (msg) => {
//     const chatId = msg.chat.id;

//     // Check if the user is already subscribed
//     let user = await User.findOne({ chatId });
//     if (!user) {
//         user = new User({ chatId });
//         await user.save(); // Save the new user
//         bot.sendMessage(chatId, 'You will now receive token boost notifications!');
//         logger(`User ${chatId} subscribed.`);
//     } else {
//         bot.sendMessage(chatId, 'You are already subscribed to token boost notifications.');
//         logger(`User ${chatId} tried to subscribe again but is already subscribed.`);
//     }
// });

// bot.onText(/\/test/, (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, 'This is a test message from your bot!');
// });

// // Command to stop receiving notifications
// bot.onText(/\/stop/, async (msg) => {
//     const chatId = msg.chat.id;

//     const user = await User.findOne({ chatId });
//     if (user && user.isSubscribed) {
//         user.isSubscribed = false;
//         await user.save();
//         bot.sendMessage(chatId, 'You have unsubscribed from token boost notifications.');
//     } else {
//         bot.sendMessage(chatId, 'You are not currently subscribed.');
//     }

//     logger(`User ${chatId} unsubscribed.`);
// });

// // Start monitoring tokens
// logger(`Starting the token boost monitor for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
// monitorBoostsOverThreshold();


// const axios = require('axios');
// const TelegramBot = require('node-telegram-bot-api');
// const connectDB = require('./config/db');
// const User = require('./models/User');
// const Token = require('./models/Token'); // Adjust the path as needed
// require('dotenv').config();

// // Set the new Dexscreener token boosts API URL
// const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';
// const BOOST_THRESHOLD = 400; // Only show tokens with boosts greater than this value
// const BOOST_CHECK_INTERVAL = 10; // Time interval for polling in seconds
// const BOOST_CHAIN_ID = 'solana';

// // Connect to MongoDB
// connectDB();

// // Create a Telegram bot instance
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// // Debugging log function
// const logger = (message) => {
//     console.log(`[LOG - ${new Date().toISOString()}]: ${message}`);
// };

// // Function to format token address for logging
// const formatTokenAddress = (address) => {
//     return `${address.slice(0, 4)}.....${address.slice(-5)}`;
// };

// // Fetch tokens with boosts and filter by boost amount over threshold
// const getTokensWithBoostsOverThreshold = async () => {
//     try {
//         logger(`Fetching token boosts from ${BOOSTS_URL}...`);
//         const response = await axios.get(BOOSTS_URL);

//         if (response.status === 200) {
//             const tokens = response.data;
//             const tokensWithBoosts = tokens.filter(token =>
//                 token.totalAmount >= BOOST_THRESHOLD && token.chainId === BOOST_CHAIN_ID
//             );
//             logger(`${tokensWithBoosts.length} tokens found over the threshold.`);
//             return tokensWithBoosts;
//         } else {
//             logger(`Error fetching data: ${response.status}`);
//             return [];
//         }
//     } catch (error) {
//         logger(`Error occurred: ${error.message}`);
//         return [];
//     }
// };

// // // Send notification if new or modified token
// // const sendTokenBoostMessage = async (user, token) => {
// //     // Log the incoming token for debugging
// //     logger(`Processing token: ${JSON.stringify(token)}`);

// //     // Check if the token has already been received by the user
// //     const existingToken = user.tokensReceived.find(t => t.token_address === token.tokenAddress);
// //     logger(`Existing token found for user: ${JSON.stringify(existingToken)}`);

// //     let message = '';

// //     if (!existingToken) {
// //         // New token notification
// //         message = `
// //             *New boost found for ${token.description}:*
// //             Total Boost: ${token.totalAmount}
// //             Dexscreener URL: ${token.url}
// //         `;
// //         // Add the new token to the user's received tokens
// //         user.tokensReceived.push({
// //             token_address: token.tokenAddress,
// //             boost_amount: token.totalAmount
// //         });
// //         logger(`User ${user.chatId} will receive new token ${token.tokenAddress}.`);
// //     } else if (existingToken.boost_amount !== token.totalAmount) {
// //         // Boost has changed, notify user
// //         message = `
// //             *Modified boost found for ${token.description}:*
// //             Updated Boost: ${token.totalAmount}
// //             Previous Boost: ${existingToken.boost_amount}
// //             Dexscreener URL: ${token.url}
// //         `;
// //         existingToken.boost_amount = token.totalAmount; // Update the existing token's boost amount
// //         logger(`User ${user.chatId} will receive modified boost for token ${token.tokenAddress}.`);
// //     }

// //     // Send notification if there is a message to send
// //     if (message) {
// //         try {
// //             await bot.sendMessage(user.chatId, message, { parse_mode: 'Markdown' });
// //             await user.save(); // Save updates to MongoDB
// //             logger(`Notification sent to ${user.chatId} for token ${token.tokenAddress}.`);

// //             // Ensure user tokens are updated in MongoDB
// //             logger(`User tokens before save: ${JSON.stringify(user.tokensReceived)}`);
// //             await user.save();
// //             logger(`User tokens after save: ${JSON.stringify(user.tokensReceived)}`);
// //         } catch (error) {
// //             logger(`Failed to send message or save user: ${error}`);
// //         }
// //     }

// //     // Notify all users about the token boost
// //     const chatIds = Object.keys(userNotifications);
// //     for (const chatId of chatIds) {
// //         // Check if the user has already received this token
// //         const tokenStatus = hasUserReceivedToken(chatId, token);
// //         logger(`Token status for ${chatId}: ${tokenStatus}`);

// //         // Only send the message if the user hasn't received it yet
// //         if (!tokenStatus && message) {
// //             try {
// //                 await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
// //                 logUserToken(chatId, token); // Log or update the token info for the user

// //                 // Log token to MongoDB
// //                 let existingTokenInDB = await Token.findOne({ tokenAddress: token.token_address });
// //                 if (existingTokenInDB) {
// //                     existingTokenInDB.boostAmount = token.totalAmount; // Update if needed
// //                     await existingTokenInDB.save();
// //                     logger(`Updated token ${token.token_address} in DB.`);
// //                 } else {
// //                     const newToken = new Token({
// //                         tokenAddress: token.token_address,
// //                         boostAmount: token.totalAmount,
// //                     });
// //                     await newToken.save();
// //                     logger(`Logged new token ${token.token_address} in DB.`);
// //                 }
// //             } catch (error) {
// //                 logger(`Failed to send message to ${chatId} or save token: ${error}`);
// //             }
// //         }
// //     }
// // };

// // Send notification if new or modified token
// const sendTokenBoostMessage = async (user, token) => {
//     const formattedTokenAddress = formatTokenAddress(token.tokenAddress);
//     // logger(`Processing token: ${formattedTokenAddress}`);
//     // Check if the token has been received before
//     const existingToken = user.tokensReceived.find(t =>{ logger(t); return t.token_address === token.tokenAddress;});
//     logger(`Existing token found for user: ${existingToken ? formattedTokenAddress : 'None'}`);
//     // Log token to MongoDB first
//     try {
//         let existingTokenInDB = await Token.findOne({ tokenAddress: token.tokenAddress });
//         if (existingTokenInDB) {
//             // Update if the boost amount has changed
//             if (existingTokenInDB.boostAmount !== token.totalAmount) {
//                 existingTokenInDB.boostAmount = token.totalAmount;
//                 await existingTokenInDB.save();
//                 // logger(`Updated token ${formattedTokenAddress} in DB.`);
//             }
//         } else {
//             // Create a new token entry
//             const newToken = new Token({
//                 tokenAddress: token.tokenAddress,
//                 boostAmount: token.totalAmount,
//                 firstFetchedAt: new Date() // Log the first fetched time
//             });
//             await newToken.save();
//             // logger(`Logged new token ${formattedTokenAddress} in DB.`);
//         }
//     } catch (error) {
//         // logger(`Error logging token ${formattedTokenAddress} in DB: ${error}`);
//         return; // Exit the function if the token logging fails
//     }

//     let message = '';
//     if (!existingToken) {
//         // New token notification
//         message = `
//             *New boost found for ${token.description}:*
//             Token Address: ${token.tokenAddress}
//             First Fetched At: ${new Date(token.firstFetchedAt).toUTCString()} 
//             Total Boost: ${token.totalAmount}
//             Dexscreener URL: ${token.url}
//         `;
//         user.tokensReceived.push({
//             token_address: token.tokenAddress,
//             boost_amount: token.totalAmount
//         });
//         // logger(`User ${user.chatId} will receive new token ${formattedTokenAddress}.`);
//     } else if (existingToken.boost_amount !== token.totalAmount) {
//         // Boost has changed, notify user
//         message = `
//             *Modified boost found for ${token.description}:*
//             Token Address: ${token.tokenAddress}
//             First Fetched At: ${new Date(token.firstFetchedAt).toUTCString()} 
//             Updated Boost: ${token.totalAmount}
//             Previous Boost: ${existingToken.boost_amount}
//             Dexscreener URL: ${token.url}
//         `;
//         existingToken.boost_amount = token.totalAmount; // Update existing token's boost amount
//         // logger(`User ${user.chatId} will receive modified boost for token ${formattedTokenAddress}.`);
//     }

//     // Send message to the user if there's a message to send
//     if (message) {
//         try {
//             await bot.sendMessage(user.chatId, message, { parse_mode: 'Markdown',disable_web_page_preview: true });
//             await user.save(); // Save user updates to MongoDB
//             // logger(`Notification sent to ${user.chatId} for token ${formattedTokenAddress}.`);
//         } catch (error) {
//             // logger(`Failed to send message to ${user.chatId} or save user: ${error}`);
//         }
//     }
    
//     // Log or update the token info for all users
//     const chatIds = Object.keys(userNotifications);
//     for (const chatId of chatIds) {
//         if (!hasUserReceivedToken(chatId, token) && message) {
//             try {
//                 await bot.sendMessage(chatId, message, { parse_mode: 'Markdown',disable_web_page_preview: true  });
//                 logUserToken(chatId, token); // Log or update the token info for the user
//             } catch (error) {
//                 // logger(`Failed to send message to ${chatId}: ${error}`);
//             }
//         }
//     }
// };




// // Monitor token boosts and notify users
// const monitorBoostsOverThreshold = async () => {
//     while (true) {
//         const tokensWithBoosts = await getTokensWithBoostsOverThreshold();

//         // Find subscribed users from MongoDB
//         const subscribedUsers = await User.find({ isSubscribed: true });

//         for (const token of tokensWithBoosts) {
//             for (const user of subscribedUsers) {
//                 await sendTokenBoostMessage(user, token);
//             }
//         }

//         logger(`Next check in ${BOOST_CHECK_INTERVAL} seconds...`);
//         await new Promise(resolve => setTimeout(resolve, BOOST_CHECK_INTERVAL * 1000));
//     }
// };

// // Define userNotifications globally
// const userNotifications = {}; // Object to store user notification subscriptions

// bot.onText(/\/start/, async (msg) => {
//     const chatId = msg.chat.id;

//     // Check if the user is already subscribed
//     let user = await User.findOne({ chatId });
//     if (!user) {
//         user = new User({ chatId });
//         await user.save(); // Save the new user
//         bot.sendMessage(chatId, 'You will now receive token boost notifications!');
//         logger(`User ${chatId} subscribed.`);
//     } else {
//         bot.sendMessage(chatId, 'You are already subscribed to token boost notifications.');
//         logger(`User ${chatId} tried to subscribe again but is already subscribed.`);
//     }
// });

// bot.onText(/\/test/, (msg) => {
//     const chatId = msg.chat.id;
//     bot.sendMessage(chatId, 'This is a test message from your bot!');
// });


// // Command to stop receiving notifications
// bot.onText(/\/stop/, async (msg) => {
//     const chatId = msg.chat.id;

//     const user = await User.findOne({ chatId });
//     if (user && user.isSubscribed) {
//         user.isSubscribed = false;
//         await user.save();
//         bot.sendMessage(chatId, 'You have unsubscribed from token boost notifications.');
//     } else {
//         bot.sendMessage(chatId, 'You are not currently subscribed.');
//     }

//     logger(`User ${chatId} unsubscribed.`);
// });

// // Start monitoring tokens
// logger(`Starting the token boost monitor for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
// monitorBoostsOverThreshold();


// const express = require('express');
// const connectDB = require('./config/db');
// const tokenRoutes = require('./routes/tokenRoutes');
// require('dotenv').config();
// require('./telegramBot');  // Initialize Telegram bot

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Connect to MongoDB
// connectDB();

// // Middleware
// app.use(express.json());

// // Routes
// app.use('/api', tokenRoutes);

// // Start the server
// app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
// });

// // Handle graceful shutdown
// process.on('SIGINT', () => {
//     console.log('Stopping Telegram bot and shutting down...');
//     process.exit();
// });



// const axios = require('axios');
// const TelegramBot = require('node-telegram-bot-api');
// require('dotenv').config();

// // Set the new Dexscreener token boosts API URL
// const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';
// const BOOST_THRESHOLD = 400; // Only show tokens with boosts greater than this value
// const BOOST_CHECK_INTERVAL = 10; // Time interval for polling in seconds
// const BOOST_CHAIN_ID = 'solana';

// // Create a Telegram bot instance
// const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// // Store user IDs who have received notifications
// const userNotifications = {};

// // This will track sent tokens per user with token address and totalAmount
// const userTokenLogs = {};

// // Global storage for first time a token is fetched
// const tokenFirstFetchTime = {};

// // Detailed logger for tracking operations
// const logger = (message) => {
//     console.log(`[LOG - ${new Date().toISOString()}]: ${message}`);
// };

// // Function to get the current GMT time in ISO format
// const getCurrentTimeGMT = () => {
//     return new Date().toISOString();
// };

// // Function to fetch the tokens with boosts and filter by boost amount over threshold
// const getTokensWithBoostsOverThreshold = async () => {
//     try {
//         logger(`Fetching token boosts from ${BOOSTS_URL}...`);
//         const response = await axios.get(BOOSTS_URL);

//         if (response.status === 200) {
//             logger('Data fetched successfully.');
//             const tokens = response.data;
//             const tokensWithBoosts = [];

//             for (const token of tokens) {
//                 // Check if the token has a boost amount over the threshold and matches the required chain
//                 if (token.totalAmount >= BOOST_THRESHOLD && token.chainId === BOOST_CHAIN_ID) {
//                     tokensWithBoosts.push({
//                         token_name: token.description || 'Unknown token',
//                         token_address: token.tokenAddress || 'Unknown address',
//                         boost_amount: token.totalAmount || 0,
//                         url: token.url || 'No URL'
//                     });
//                     logger(`Token added: ${token.tokenAddress || 'Unknown token'} with boost ${token.totalAmount}`);

//                     // If token is encountered for the first time, log its first fetch time globally
//                     if (!tokenFirstFetchTime[token.token_address]) {
//                         tokenFirstFetchTime[token.token_address] = getCurrentTimeGMT();
//                         logger(`Logged first fetch time for token ${token.token_address}: ${tokenFirstFetchTime[token.token_address]}`);
//                     }
//                 }
//             }
//             logger(`${tokensWithBoosts.length} tokens found over the threshold.`);
//             return tokensWithBoosts;
//         } else {
//             logger(`Error fetching data: ${response.status}`);
//             return [];
//         }
//     } catch (error) {
//         logger(`Error occurred: ${error.message}`);
//         return [];
//     }
// };

// // Function to check if a user has received a token with the same or different totalAmount
// const hasUserReceivedToken = (userId, token) => {
//     if (!userTokenLogs[userId]) {
//         userTokenLogs[userId] = []; // Initialize if no logs exist
//     }

//     const tokenLog = userTokenLogs[userId].find(log => log.token_address === token.token_address);
    
//     if (tokenLog) {
//         if (tokenLog.boost_amount === token.boost_amount) {
//             logger(`User ${userId} has already received token ${token.token_address} with the same boost amount.`);
//             return 'same'; // Token already sent with the same boost amount
//         } else {
//             logger(`User ${userId} has received token ${token.token_address} but the boost amount has changed.`);
//             return 'changed'; // Token has changed boost amount
//         }
//     }

//     logger(`User ${userId} has not received token ${token.token_address} before.`);
//     return 'new'; // Token has not been sent before
// };

// // Function to log that a token has been sent to a user
// const logUserToken = (userId, token) => {
//     const tokenLog = userTokenLogs[userId].find(log => log.token_address === token.token_address);
    
//     if (tokenLog) {
//         tokenLog.boost_amount = token.boost_amount; // Update the boost amount
//         logger(`Updated boost amount for token ${token.token_name} for user ${userId}: ${token.boost_amount}`);
//     } else {
//         userTokenLogs[userId].push({
//             token_address: token.token_address,
//             boost_amount: token.boost_amount
//         });
//         logger(`Logged token ${token.token_name} for user ${userId} with boost amount: ${token.boost_amount}`);
//     }
// };

// // Function to send messages to users about new or updated tokens
// const sendTokenBoostMessage = async (token) => {
//     // Fetch the first fetch time from the global log
//     let firstFetchTime = tokenFirstFetchTime[token.token_address];

//     // If this token is fetched for the first time, log the current GMT time
//     if (!firstFetchTime) {
//         firstFetchTime = getCurrentTimeGMT();
//         tokenFirstFetchTime[token.token_address] = firstFetchTime; // Log it globally
//         logger(`Logged first fetch time for token ${token.token_address}: ${firstFetchTime}`);
//     }

//     const chatIds = Object.keys(userNotifications);
//     for (const chatId of chatIds) {
//         // Check if the user has already received this token information based on boost amount
//         const tokenStatus = hasUserReceivedToken(chatId, token);

//         let message;
//         if (tokenStatus === 'new') {
//             message = `
//                 *New boost over ${BOOST_THRESHOLD} found for ${token.token_name}:*
//                 Total Boost: ${token.boost_amount}
//                 First Fetched Time: ${firstFetchTime}
//                 Dexscreener URL: ${token.url}
//             `;
//         } else if (tokenStatus === 'changed') {
//             message = `
//                 *Modified boost found for ${token.token_name}:*
//                 Updated Boost: ${token.boost_amount}
//                 First Fetched Time: ${firstFetchTime}
//                 Dexscreener URL: ${token.url}
//             `;
//         }

//         // Send message only if it's new or modified
//         if (message) {
//             await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
//             logUserToken(chatId, token); // Log or update the token info for the user
//         }
//     }
// };

// // Function to continuously check for tokens with boosts over the threshold
// const monitorBoostsOverThreshold = async () => {
//     while (true) {
//         logger(`\nChecking for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
//         const tokensWithBoosts = await getTokensWithBoostsOverThreshold();

//         for (const token of tokensWithBoosts) {
//             // Send a message to Telegram users about the token if it's new or updated for them
//             await sendTokenBoostMessage(token);
//         }

//         logger(`Next check in ${BOOST_CHECK_INTERVAL} seconds...\n`);
//         await new Promise(resolve => setTimeout(resolve, BOOST_CHECK_INTERVAL * 1000));
//     }
// };

// // Command to start receiving notifications
// bot.onText(/\/start/, (msg) => {
//     const chatId = msg.chat.id;
//     if (!userNotifications[chatId]) {
//         userNotifications[chatId] = true; // Mark user as having received notifications
//         bot.sendMessage(chatId, 'You will now receive token boost notifications!');
//         logger(`User ${chatId} subscribed to notifications.`);
//     } else {
//         bot.sendMessage(chatId, 'You are already subscribed to token boost notifications.');
//         logger(`User ${chatId} tried to subscribe again but is already subscribed.`);
//     }
// });

// // Start monitoring tokens with boosts over the threshold
// logger(`Starting the token boost monitor for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
// monitorBoostsOverThreshold();