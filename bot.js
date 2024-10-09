
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');

// Replace this with your bot's token received from BotFather
const token = '7923838203:AAGV2X-oYga25VONlRFvPZ62-MEuIYhksJk';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Array to store the users who started the bot
let botUsers = [];

// Set to store token addresses that have already been sent
const sentTokens = new Set();

// Object to track which users have received messages about which tokens
const userTokenStatus = {};

// Fetch tokens from Dexscreener API every 30 seconds
const fetchTokens = async () => {
  try {
    const response = await axios.get('https://api.dexscreener.com/token-boosts/latest/v1');
    const tokens = response.data;

    // Filter tokens with totalAmount > 500 and chainId === 'solana'
    const filteredTokens = tokens.filter(token => token.totalAmount >= 500 && token.chainId === 'solana');

    // Filter out tokens that have already been sent
    const newTokens = filteredTokens.filter(token => !sentTokens.has(token.tokenAddress));

    if (newTokens.length > 0) {
      // Send token information to each bot user
      botUsers.forEach(chatId => {
        newTokens.forEach(token => {
          sendTokenInfo(chatId, token);
        });
      });
    } else {
      console.log('No new tokens found with more than 500 boosts on Solana.');
    }
  } catch (error) {
    console.error('Error fetching tokens:', error);
  }
};

// Function to send token information
const sendTokenInfo = async (chatId, token) => {
  // Check if the user has already received information about this token
  if (!userTokenStatus[chatId]) {
    userTokenStatus[chatId] = new Set();
  }

  if (userTokenStatus[chatId].has(token.tokenAddress)) {
    return; // User has already received this token info, do not send again
  }

  try {
    // Fetch token details from Dexscreener API
    const detailsResponse = await axios.get(`https://api.dexscreener.com/orders/v1/solana/${token.tokenAddress}`);
    const tokenData = detailsResponse.data[0];

    // Extract payment timestamp and convert it to GMT
    const paymentTimestamp = new Date(tokenData.paymentTimestamp);
    const formattedTimestamp = paymentTimestamp.toGMTString();

    // Construct the message components
    const message = `**${token.name}** (Make America Based Again)\n` + // Bold first line with token name
                    `💊 Pump Status: Trading on Raydium\n` +
                    `$0.00113   🟢 +15.9K%  Price Chart | [View Chart](https://gmgn.ai/sol/token/${token.tokenAddress})\n` + // Price chart link
                    `💰 MC: $1.1M\n` + // Placeholder Market Cap
                    `💧 Liq: 418.98 SOL ($123.3K 🔥100%)\n` + // Placeholder Liquidity
                    `💰 Initial LP: 79.01 SOL (20.69% supply)\n` + // Placeholder Initial LP
                    `👥 Holders: 5704\n` + // Placeholder Holders
                    `👨‍🍳 Creator:  51HM....ULy (11.7031 SOL)\n` + // Placeholder Creator
                    `🔥 DEV Burnt: --\n` + // Placeholder Dev Burnt
                    `🕒 Open: ${formattedTimestamp}\n` + // Open time
                    `🔥 Smart Buy/Sell: -/-\n` + // Placeholder Buy/Sell
                    `🦅 DEXScreener: Advertised ❌ / Update Social ✅\n` + // Placeholder DEXScreener info
                    `🔔 Audit: NoMint ✅ / Blacklist ✅ / Burnt ✅\n` + // Placeholder Audit info
                    `👥 Top 10 holdings: 14.61%<30% ✅\n` + // Placeholder Top 10 Holdings
                    `🐀 Insiders: 9%\n` + // Placeholder Insiders
                    `📕 Rug Probability: --\n` + // Placeholder Rug Probability
                    `📒 Rug history: --\n\n` + // Placeholder Rug history
                    `Token: ${token.tokenAddress}\n` + // Token Address
                    `Backup BOT: US | 01 | 02 | 03 | 04\n\n`; // Placeholder Backup BOT info

    // Send the header image
    const imageUrl = token.header; // Replace with the actual image URL from token data
    await bot.sendPhoto(chatId, imageUrl, { caption: message }, { parse_mode: 'Markdown' });

    // Create inline buttons
    const inlineButtons = [
      [
        {
          text: "View DexScreener",
          url: token.url  // URL for DexScreener
        }
      ]
    ];

    // Add Open Graph data (this is just a message; Open Graph images are typically not supported directly)
    const openGraphMessage = `![Open Graph Image](${token.openGraph})`; // Open Graph URL

    // Send the button message with Open Graph data
    await bot.sendMessage(chatId, `${openGraphMessage}\nClick the button below:`, {
      reply_markup: {
        inline_keyboard: inlineButtons
      }
    });

    // Mark the token as sent to the user
    userTokenStatus[chatId].add(token.tokenAddress);
    sentTokens.add(token.tokenAddress); // Track sent tokens globally
  } catch (error) {
    console.error('Error fetching token details:', error);
    bot.sendMessage(chatId, "Error fetching token details.");
  }
};

// Fetch the tokens every 30 seconds
setInterval(fetchTokens, 10000);

// When a user starts the bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!botUsers.includes(chatId)) {
    botUsers.push(chatId);
    bot.sendMessage(chatId, 'Welcome! You will now receive token updates with more than 500 boosts on Solana.');
  } else {
    bot.sendMessage(chatId, 'You are already subscribed to token updates.');
  }
});

// When a user stops receiving updates
bot.onText(/\/stop/, (msg) => {
  const chatId = msg.chat.id;
  botUsers = botUsers.filter(user => user !== chatId);
  delete userTokenStatus[chatId]; // Remove user status
  bot.sendMessage(chatId, 'You have unsubscribed from token updates.');
});
