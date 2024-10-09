const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Set the new Dexscreener token boosts API URL
const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';
const BOOST_THRESHOLD = 400; // Only show tokens with boosts greater than this value
const BOOST_CHECK_INTERVAL = 10; // Time interval for polling in seconds
const BOOST_CHAIN_ID = 'solana';

// Create a Telegram bot instance
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Store user IDs who have received notifications
const userNotifications = {};

// This will track sent tokens per user with token address and totalAmount
const userTokenLogs = {};

// Global storage for first time a token is fetched
const tokenFirstFetchTime = {};

// Detailed logger for tracking operations
const logger = (message) => {
    console.log(`[LOG - ${new Date().toISOString()}]: ${message}`);
};

// Function to get the current GMT time in ISO format
const getCurrentTimeGMT = () => {
    return new Date().toISOString();
};

// Function to fetch the tokens with boosts and filter by boost amount over threshold
const getTokensWithBoostsOverThreshold = async () => {
    try {
        logger(`Fetching token boosts from ${BOOSTS_URL}...`);
        const response = await axios.get(BOOSTS_URL);

        if (response.status === 200) {
            logger('Data fetched successfully.');
            const tokens = response.data;
            const tokensWithBoosts = [];

            for (const token of tokens) {
                // Check if the token has a boost amount over the threshold and matches the required chain
                if (token.totalAmount >= BOOST_THRESHOLD && token.chainId === BOOST_CHAIN_ID) {
                    tokensWithBoosts.push({
                        token_name: token.description || 'Unknown token',
                        token_address: token.tokenAddress || 'Unknown address',
                        boost_amount: token.totalAmount || 0,
                        url: token.url || 'No URL'
                    });
                    logger(`Token added: ${token.tokenAddress || 'Unknown token'} with boost ${token.totalAmount}`);

                    // If token is encountered for the first time, log its first fetch time globally
                    if (!tokenFirstFetchTime[token.token_address]) {
                        tokenFirstFetchTime[token.token_address] = getCurrentTimeGMT();
                        logger(`Logged first fetch time for token ${token.token_address}: ${tokenFirstFetchTime[token.token_address]}`);
                    }
                }
            }
            logger(`${tokensWithBoosts.length} tokens found over the threshold.`);
            return tokensWithBoosts;
        } else {
            logger(`Error fetching data: ${response.status}`);
            return [];
        }
    } catch (error) {
        logger(`Error occurred: ${error.message}`);
        return [];
    }
};

// Function to check if a user has received a token with the same or different totalAmount
const hasUserReceivedToken = (userId, token) => {
    if (!userTokenLogs[userId]) {
        userTokenLogs[userId] = []; // Initialize if no logs exist
    }

    const tokenLog = userTokenLogs[userId].find(log => log.token_address === token.token_address);
    
    if (tokenLog) {
        if (tokenLog.boost_amount === token.boost_amount) {
            logger(`User ${userId} has already received token ${token.token_address} with the same boost amount.`);
            return 'same'; // Token already sent with the same boost amount
        } else {
            logger(`User ${userId} has received token ${token.token_address} but the boost amount has changed.`);
            return 'changed'; // Token has changed boost amount
        }
    }

    logger(`User ${userId} has not received token ${token.token_address} before.`);
    return 'new'; // Token has not been sent before
};

// Function to log that a token has been sent to a user
const logUserToken = (userId, token) => {
    const tokenLog = userTokenLogs[userId].find(log => log.token_address === token.token_address);
    
    if (tokenLog) {
        tokenLog.boost_amount = token.boost_amount; // Update the boost amount
        logger(`Updated boost amount for token ${token.token_name} for user ${userId}: ${token.boost_amount}`);
    } else {
        userTokenLogs[userId].push({
            token_address: token.token_address,
            boost_amount: token.boost_amount
        });
        logger(`Logged token ${token.token_name} for user ${userId} with boost amount: ${token.boost_amount}`);
    }
};

// Function to send messages to users about new or updated tokens
const sendTokenBoostMessage = async (token) => {
    // Fetch the first fetch time from the global log
    let firstFetchTime = tokenFirstFetchTime[token.token_address];

    // If this token is fetched for the first time, log the current GMT time
    if (!firstFetchTime) {
        firstFetchTime = getCurrentTimeGMT();
        tokenFirstFetchTime[token.token_address] = firstFetchTime; // Log it globally
        logger(`Logged first fetch time for token ${token.token_address}: ${firstFetchTime}`);
    }

    const chatIds = Object.keys(userNotifications);
    for (const chatId of chatIds) {
        // Check if the user has already received this token information based on boost amount
        const tokenStatus = hasUserReceivedToken(chatId, token);

        let message;
        if (tokenStatus === 'new') {
            message = `
                *New boost over ${BOOST_THRESHOLD} found for ${token.token_name}:*
                Total Boost: ${token.boost_amount}
                First Fetched Time: ${firstFetchTime}
                Dexscreener URL: ${token.url}
            `;
        } else if (tokenStatus === 'changed') {
            message = `
                *Modified boost found for ${token.token_name}:*
                Updated Boost: ${token.boost_amount}
                First Fetched Time: ${firstFetchTime}
                Dexscreener URL: ${token.url}
            `;
        }

        // Send message only if it's new or modified
        if (message) {
            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            logUserToken(chatId, token); // Log or update the token info for the user
        }
    }
};

// Function to continuously check for tokens with boosts over the threshold
const monitorBoostsOverThreshold = async () => {
    while (true) {
        logger(`\nChecking for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
        const tokensWithBoosts = await getTokensWithBoostsOverThreshold();

        for (const token of tokensWithBoosts) {
            // Send a message to Telegram users about the token if it's new or updated for them
            await sendTokenBoostMessage(token);
        }

        logger(`Next check in ${BOOST_CHECK_INTERVAL} seconds...\n`);
        await new Promise(resolve => setTimeout(resolve, BOOST_CHECK_INTERVAL * 1000));
    }
};

// Command to start receiving notifications
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    if (!userNotifications[chatId]) {
        userNotifications[chatId] = true; // Mark user as having received notifications
        bot.sendMessage(chatId, 'You will now receive token boost notifications!');
        logger(`User ${chatId} subscribed to notifications.`);
    } else {
        bot.sendMessage(chatId, 'You are already subscribed to token boost notifications.');
        logger(`User ${chatId} tried to subscribe again but is already subscribed.`);
    }
});

// Start monitoring tokens with boosts over the threshold
logger(`Starting the token boost monitor for tokens with boosts over ${BOOST_THRESHOLD}...\n`);
monitorBoostsOverThreshold();
