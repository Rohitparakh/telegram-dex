const TelegramBot = require('node-telegram-bot-api');
const { subscribeUser, unsubscribeUser } = require('../services/userService');
const { logger } = require('../utils/logger');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    // const username = msg.from.username; // Retrieve the username
    const firstName = msg.from.first_name; // You can also get the first name
    const user = await subscribeUser(chatId);
    bot.sendMessage(chatId, `Hey ${firstName}, you will now receive token notifications!`);
    logger(`User ${chatId} subscribed.`);
});

// Stop command
bot.onText(/\/stop/, async (msg) => {
    const chatId = msg.chat.id;
    await unsubscribeUser(chatId);
    bot.sendMessage(chatId, 'You have unsubscribed from token notifications.');
});

// Test command
bot.onText(/\/test/, (msg) => {
    bot.sendMessage(msg.chat.id, 'This is a test message.');
});

module.exports = bot;
