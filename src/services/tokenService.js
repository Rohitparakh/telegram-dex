// src/services/tokenService.js

const Token = require('../models/tokenModel'); // Ensure this path is correct
const { logger, formatTokenAddress, formatNumber } = require('../utils/logger');
const bot = require('../bot/telegramBot'); // Import the bot instance
const { default: axios } = require('axios');
const TOKEN_DETAILS_URL = 'https://api.dexscreener.com/latest/dex/tokens';

// Send notification if new or modified token
const sendTokenBoostMessage = async (user, token) => {
    // Token is from DexScreener API that gives latest boosts, User is User collection from MongoDB
    const formattedTokenAddress = formatTokenAddress(token.tokenAddress);
    // logger(token.tokenAddress);
    const existingToken = user.tokensReceived.find(t => t.tokenAddress === token.tokenAddress);
    logger(`Existing token found for user: ${existingToken ? formattedTokenAddress : 'None'}`);
    if(existingToken)return;

    logger(`Fetching token details from ${TOKEN_DETAILS_URL} for ${formatTokenAddress(token.tokenAddress)}`);
    const response = await axios.get(`${TOKEN_DETAILS_URL}/${token.tokenAddress}`);    
    const tokenDetails = response.data.pairs[0];
    // logger(tokenDetails.info.websites[0].url)
    // Check if the token has been received before
    

    // Find the token in the database
    let tokenFromDB = await Token.findOne({ tokenAddress: token.tokenAddress });
    // let firstFetchedAt = tokenFromDB ? tokenFromDB.firstFetchedAt : null;

    // Log token to MongoDB first
    try {
        if (tokenFromDB) {
            // Update existing token details
            tokenFromDB.name = tokenDetails.baseToken.name;
            tokenFromDB.symbol = tokenDetails.baseToken.symbol;
            tokenFromDB.marketCap = tokenDetails.marketCap;
            tokenFromDB.websites = tokenDetails.info.websites;
            tokenFromDB.socials = tokenDetails.info.socials;
            tokenFromDB.boostAmount = token.totalAmount; // Update boost amount
            tokenFromDB.firstFetchedAt = tokenFromDB.firstFetchedAt || Date.now(); // Only set if not already set
            await tokenFromDB.save();
        } else {
            // Create a new token entry with firstFetchedAt
            const newToken = new Token({
                tokenAddress: token.tokenAddress,
                boostAmount: token.totalAmount,
                firstFetchedAt: new Date(), // Log the first fetched time
                name: tokenDetails.baseToken.name,
                symbol: tokenDetails.baseToken.symbol,
                marketCap: tokenDetails.marketCap,
                websites: tokenDetails.info.websites,
                socials: tokenDetails.info.socials,
            });
            await newToken.save();
            tokenFromDB = newToken; // Use the new token for further operations
        }
    } catch (error) {
        logger('Error saving token:', error);
        return; // Exit the function if the token logging fails
    }

    let message = '';
    const imageUrl = token.header? token.header: token.icon; // Assume this URL comes from the Dex API
    if (!existingToken && tokenDetails.marketCap<=1000000) {
        // New token notification
        message = `   
            💎New Gem Alert
            🔗Chain: ${token.chainId}
            💊Platform: ${tokenDetails.dexId} 

            ${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol})

            ${user.isAdmin?`Total Boost: ${token.totalAmount}`:null}
            ${user.isAdmin?`First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}`:null}

            📝Token address: \`${token.tokenAddress}\` 

            💲Call Mc: ${formatNumber(tokenDetails.marketCap)}
            📛Volume 
            🔑Liquidity: ${formatNumber(tokenDetails.liquidity.usd)} 

            🔐Socials
            Dexscreener URL: ${token.url}
        `;
//         *New boost found for ${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol}):*
//             Token Address: ${token.tokenAddress}
//             Total Boost: ${token.totalAmount}
//             Call MC: ${formatNumber(tokenDetails.marketCap)}
// First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}    
//         Dexscreener URL: ${token.url}
        user.tokensReceived.push({
            tokenAddress: token.tokenAddress,
            boostAmount: token.totalAmount,
            name: tokenDetails.baseToken.name,
            symbol: tokenDetails.baseToken.symbol,
            marketCap: tokenDetails.marketCap,
            websites: tokenDetails.info.websites,
            socials: tokenDetails.info.socials,
        });
    } 
    // else if (existingToken.boostAmount !== token.totalAmount) {
    //     // Boost has changed, notify user
    //     message = `
    //         *Modified boost found for ${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol}):*
    //         Token Address: ${token.tokenAddress}
    //         Call MC: ${formatNumber(tokenDetails.marketCap)}
    //         Updated Boost: ${token.totalAmount}
    //         Previous Boost: ${existingToken.boostAmount}
    //         First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}
    //         Dexscreener URL: ${token.url}
    //     `;
    //     existingToken.boostAmount = token.totalAmount; // Update existing token's boost amount
    // }

    // Send message to the user if there's a message to send
    if (message) {        
        try {            
               // Send photo with caption using sendPhoto method
        await bot.sendPhoto(user.chatId, imageUrl, {
            caption: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: true
        });

        console.log('Message with image sent successfully');
            // await bot.sendMessage(user.chatId, message, { parse_mode: 'Markdown', disable_web_page_preview: true });
            await user.save(); // Save user updates to MongoDB
        } catch (error) {
            // Handle errors here
            console.log('Error sending message to user:', error);
        }
    }
};

module.exports = {
    sendTokenBoostMessage,
    // other exports...
};
