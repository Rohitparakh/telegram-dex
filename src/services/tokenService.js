const Token = require('../models/tokenModel'); // Ensure this path is correct
const { logger, formatTokenAddress, formatNumber } = require('../utils/logger');
const bot = require('../bot/telegramBot'); // Import the bot instance
const { default: axios } = require('axios');
const TOKEN_DETAILS_URL = 'https://api.dexscreener.com/latest/dex/tokens';

const sendTokenBoostMessage = async (user, token) => {
    const formattedTokenAddress = formatTokenAddress(token.tokenAddress);
    const existingToken = user.tokensReceived.find(t => t.tokenAddress === token.tokenAddress);
    logger(`Existing token found for user: ${existingToken ? formattedTokenAddress : 'None'}`);
    if(existingToken)return;

    logger(`Fetching token details from ${TOKEN_DETAILS_URL} for ${formatTokenAddress(token.tokenAddress)}`);
    const response = await axios.get(`${TOKEN_DETAILS_URL}/${token.tokenAddress}`);    
    const tokenDetails = response.data.pairs[0];

    let tokenFromDB = await Token.findOne({ tokenAddress: token.tokenAddress });

    try {
        if (tokenFromDB) {
            tokenFromDB.name = tokenDetails.baseToken.name;
            tokenFromDB.symbol = tokenDetails.baseToken.symbol;
            tokenFromDB.marketCap = tokenDetails.marketCap;
            tokenFromDB.websites = tokenDetails.info.websites;
            tokenFromDB.socials = tokenDetails.info.socials;
            tokenFromDB.boostAmount = token.totalAmount; // Update boost amount
            tokenFromDB.firstFetchedAt = tokenFromDB.firstFetchedAt || Date.now(); // Only set if not already set
            await tokenFromDB.save();
        } else {
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
    if (!existingToken && tokenDetails.marketCap<=1000000 && tokenDetails.liquidity.usd>=15000) {
        
const socials = tokenDetails.info.socials;

const hasValidUrls = socials.some(social => social.url);
let socialLinks = null;

if (hasValidUrls) {
     socialLinks = socials?.map(social => {
    const type = social.type;  // Social type, e.g., "Twitter"
    const url = social.url;    // Social URL, e.g., "https://twitter.com/token"    
    return `🔗 [${type.charAt(0).toUpperCase() + type.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}

const websites = tokenDetails.info.websites;

const hasValidWebsiteUrls = websites.some(website => website.url);
let websiteLinks = null;
if (hasValidWebsiteUrls) {
            websiteLinks = websites?.map(website => {
    const label = website.label;  
    const url = website.url;        
    return `🔗 [${label.charAt(0).toUpperCase() + label.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}


        message = `   
💎New Gem Alert
🔗Chain: ${token.chainId.charAt(0).toUpperCase() + token.chainId.slice(1)}
💊Platform: ${tokenDetails.dexId.charAt(0).toUpperCase() + tokenDetails.dexId.slice(1)} 

💰${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol})

${user.isAdmin?`Total Boost: ${token.totalAmount} \n First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}\n \n`:''}📝Token address: \`${token.tokenAddress}\`                         

💲Call Mc: ${formatNumber(tokenDetails.marketCap)}
📛Volume:
5M: ${formatNumber(tokenDetails.volume.m5)} | 1H: ${formatNumber(tokenDetails.volume.h1)} | 6H: ${formatNumber(tokenDetails.volume.h6)} | 24H: ${formatNumber(tokenDetails.volume.h24)}
🔑Liquidity: ${formatNumber(tokenDetails.liquidity.usd)} 

Price Change:
5M: ${tokenDetails.priceChange.m5}% | 1H: ${tokenDetails.priceChange.h1}% | 6H: ${tokenDetails.priceChange.h6}% | 24H: ${tokenDetails.priceChange.h24}%

${socialLinks?`Links: \n${socialLinks}\n`:``}${websiteLinks?`${websiteLinks}\n \n`:``}💫 Dexscreener URL: ${token.url}
        `;
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

    if (message) {        
        try {            
            await bot.sendPhoto(user.chatId, imageUrl, {
                caption: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            logger('Message with image sent successfully');
            logger('Token Address sent successfully');
            await user.save(); // Save user updates to MongoDB
        } catch (error) {
            if (error.response && error.response.statusCode === 403) {
                console.error(`User has blocked the bot: ${user.chatId}`);
            } else {
                console.error('An unexpected error occurred:', error);
            }
        }
    }
};

const sendNewTokenMessage = async (user, token) => {
    logger('Starting New Message to '+user.id)
    const formattedTokenAddress = formatTokenAddress(token.tokenAddress);
    const existingToken = user.tokensReceived.find(t => t.tokenAddress === token.tokenAddress);
    logger(`Existing token found for user: ${existingToken ? formattedTokenAddress : 'None'}`);
    if(existingToken)return;

    logger(`Fetching token details from ${TOKEN_DETAILS_URL} for ${formatTokenAddress(token.tokenAddress)}`);
    const response = await axios.get(`${TOKEN_DETAILS_URL}/${token.tokenAddress}`);    
    const tokenDetails = response.data.pairs[0];

    let tokenFromDB = await Token.findOne({ tokenAddress: token.tokenAddress });

    try {
    } catch (error) {
        logger('Error saving token:', error);
        return; // Exit the function if the token logging fails
    }

    let message = '';
    const imageUrl = token.header? token.header: token.icon; // Assume this URL comes from the Dex API
        
const socials = tokenDetails.info.socials;

const hasValidUrls = socials.some(social => social.url);
let socialLinks = null;
if (hasValidUrls) {
     socialLinks = socials?.map(social => {
    const type = social.type;  // Social type, e.g., "Twitter"
    const url = social.url;    // Social URL, e.g., "https://twitter.com/token"    
    return `🔗 [${type.charAt(0).toUpperCase() + type.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}

const websites = tokenDetails.info.websites;

const hasValidWebsiteUrls = websites.some(website => website.url);
let websiteLinks = null;
if (hasValidWebsiteUrls) {
            websiteLinks = websites?.map(website => {
    const label = website.label;  
    const url = website.url;        
    return `🔗 [${label.charAt(0).toUpperCase() + label.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}


        message = `   
💎Pumpfun to Dex Alert:
🔗Chain: ${token.chainId.charAt(0).toUpperCase() + token.chainId.slice(1)}
💊Platform: ${tokenDetails.dexId.charAt(0).toUpperCase() + tokenDetails.dexId.slice(1)} 

💰${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol})

📝Token address: \`${token.tokenAddress}\`                         

💲Call Mc: ${formatNumber(tokenDetails.marketCap)}
📛Volume:
5M: ${formatNumber(tokenDetails.volume.m5)} | 1H: ${formatNumber(tokenDetails.volume.h1)} | 6H: ${formatNumber(tokenDetails.volume.h6)} | 24H: ${formatNumber(tokenDetails.volume.h24)}
🔑Liquidity: ${formatNumber(tokenDetails.liquidity.usd)} 

Price Change:
5M: ${tokenDetails.priceChange.m5}% | 1H: ${tokenDetails.priceChange.h1}% | 6H: ${tokenDetails.priceChange.h6}% | 24H: ${tokenDetails.priceChange.h24}%

${socialLinks?`Links: \n${socialLinks}\n`:``}${websiteLinks?`${websiteLinks}\n \n`:``}💫 Dexscreener URL: ${token.url}
        `;
        user.tokensReceived.push({
            tokenAddress: token.tokenAddress,
            boostAmount: token.totalAmount,
            name: tokenDetails.baseToken.name,
            symbol: tokenDetails.baseToken.symbol,
            marketCap: tokenDetails.marketCap,
            websites: tokenDetails.info.websites,
            socials: tokenDetails.info.socials,
        });

        if (message) {        
        try {            
            await bot.sendPhoto(user.chatId, imageUrl, {
                caption: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            logger('Message with image sent successfully');
            logger('Token Address sent successfully');
            await user.save(); // Save user updates to MongoDB
        } catch (error) {
            console.log('Error sending message to user:', user.chatId);
        }
    }
    logger('Ending New Message to '+user.id)
};

module.exports = {
    sendTokenBoostMessage,
    sendNewTokenMessage
};
