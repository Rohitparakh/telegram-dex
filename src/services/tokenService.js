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
    // logger(`Existing token found for ${user.username?user.username:'user'}: ${existingToken ? formattedTokenAddress : 'None'}`);
    if(existingToken)return;

    // logger(`Fetching token details from ${TOKEN_DETAILS_URL} for ${formatTokenAddress(token.tokenAddress)}`);
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
        
const socials = tokenDetails.info.socials;

// Check if there are any socials with a valid URL
const hasValidUrls = socials.some(social => social.url);
let socialLinks = null;
// If no valid URLs are found, return null or handle accordingly
if (hasValidUrls) {
            // Loop through socials and generate the Markdown string
     socialLinks = socials?.map(social => {
    const type = social.type;  // Social type, e.g., "Twitter"
    const url = social.url;    // Social URL, e.g., "https://twitter.com/token"    
    // Return formatted MarkdownV2 link for each social
    return `🔗 [${type.charAt(0).toUpperCase() + type.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}

const websites = tokenDetails.info.websites;

// Check if there are any socials with a valid URL
const hasValidWebsiteUrls = websites.some(website => website.url);
let websiteLinks = null;
// If no valid URLs are found, return null or handle accordingly
if (hasValidWebsiteUrls) {
            // Loop through socials and generate the Markdown string
            websiteLinks = websites?.map(website => {
    const label = website.label;  
    const url = website.url;        
    // Return formatted MarkdownV2 link for each social
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

//     // Send message to the user if there's a message to send
//     if(process.env.NODE_ENV === "development"){
//         // Chat ID of MaestroSniperBot
// const chatId = '@MaestroSniperBot';

// // Function to send a message
// const sendMessage = (tokenAddress) => {
//     bot.sendMessage(chatId, `Token: ${tokenAddress}`)
//         .then(() => {
//             console.log('Message sent successfully to Maestro.');
//         })
//         .catch((error) => {
//             console.error('Failed to send message to Maestro:', error);
//         });
// };

// sendMessage(token.tokenAddress);

//     }
    if (message) {        
        try {            
            // Send photo with caption using sendPhoto method
            await bot.sendPhoto(user.chatId, imageUrl, {
                caption: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            logger('Message with image sent successfully');
            // await bot.sendMessage(user.chatId, `${token.tokenAddress}`, { parse_mode: 'Markdown', disable_web_page_preview: true });    
            logger('Token Address sent successfully');
            await user.save(); // Save user updates to MongoDB
        } catch (error) {
            // Handle errors here
            console.log('Error sending message to user:', error);
        }
    }
};

// // Send notification if new or modified token
// const sendNewTokenMessage = async (user, token) => {
//     logger("Starting new token message send")
//     // Token is from DexScreener API that gives latest token launches, User is User collection from MongoDB
//     const formattedTokenAddress = formatTokenAddress(token.baseToken.address);

//     const existingToken = user.tokensReceived.find(t => t.tokenAddress === token.baseToken.address);
//     // logger(`Existing token found for ${user.username?user.username:'user'}: ${existingToken ? formattedTokenAddress : 'None'}`);
//     if(existingToken)return;    

//     // Find the token in the database
//     let tokenFromDB = await Token.findOne({ tokenAddress: token.baseToken.address });
//     // let firstFetchedAt = tokenFromDB ? tokenFromDB.firstFetchedAt : null;

//     // Log token to MongoDB first
//     try {
//         if (tokenFromDB) {
//             // Update existing token details
//             tokenFromDB.name = token.baseToken.name;
//             tokenFromDB.symbol = token.baseToken.symbol;
//             tokenFromDB.marketCap = token.marketCap;
//             tokenFromDB.websites = token.info.websites;
//             tokenFromDB.socials = token.info.socials;
//             tokenFromDB.firstFetchedAt = tokenFromDB.firstFetchedAt || Date.now(); // Only set if not already set
//             await tokenFromDB.save();
//         } else {
//             // Create a new token entry with firstFetchedAt
//             const newToken = new Token({
//                 tokenAddress: token.baseToken.address,                
//                 firstFetchedAt: new Date(), // Log the first fetched time
//                 name: token.baseToken.name,
//                 symbol: token.baseToken.symbol,
//                 marketCap: token.marketCap,
//                 websites: token.info.websites,
//                 socials: token.info.socials,
//             });
//             await newToken.save();
//             tokenFromDB = newToken; // Use the new token for further operations
//         }
//     } catch (error) {
//         console.log('Error saving token:', error);
//         return; // Exit the function if the token logging fails
//     }

//     let message = '';
//     const imageUrl = token.profile.banner? token.profile.banner: token.profile.icon; // Assume this URL comes from the Dex API
//     if (!existingToken) {
//         // New token notification
        
// const socials = tokenDetails.info.socials;

// // Check if there are any socials with a valid URL
// const hasValidUrls = socials.some(social => social.url);
// let socialLinks = null;
// // If no valid URLs are found, return null or handle accordingly
// if (hasValidUrls) {
//             // Loop through socials and generate the Markdown string
//      socialLinks = socials?.map(social => {
//     const type = social.type;  // Social type, e.g., "Twitter"
//     const url = social.url;    // Social URL, e.g., "https://twitter.com/token"    
//     // Return formatted MarkdownV2 link for each social
//     return `🔗 [${type.charAt(0).toUpperCase() + type.slice(1)}](${url.replace(/_/g, '\\_')})`;
// }).join('\n');
// }

// const websites = tokenDetails.info.websites;

// // Check if there are any socials with a valid URL
// const hasValidWebsiteUrls = websites.some(website => website.url);
// let websiteLinks = null;
// // If no valid URLs are found, return null or handle accordingly
// if (hasValidWebsiteUrls) {
//             // Loop through socials and generate the Markdown string
//             websiteLinks = websites?.map(website => {
//     const label = website.label;  
//     const url = website.url;        
//     // Return formatted MarkdownV2 link for each social
//     return `🔗 [${label.charAt(0).toUpperCase() + label.slice(1)}](${url.replace(/_/g, '\\_')})`;
// }).join('\n');
// }


//         message = `   
// 💎Newly Launched Gem Alert
// 🔗Chain: ${token.chainId.charAt(0).toUpperCase() + token.chainId.slice(1)}
// 💊Platform: ${token.dexId.charAt(0).toUpperCase() + tokenDetails.dexId.slice(1)} 

// 💰${token.baseToken.name} (${token.baseToken.symbol})

// ${user.isAdmin?`First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}\n \n`:''}📝Token address: \`${token.baseToken.address}\`                         

// 💲Call Mc: ${formatNumber(token.marketCap)}
// 📛Volume:
// 5M: ${formatNumber(token.volume.m5)} | 1H: ${formatNumber(token.volume.h1)} | 6H: ${formatNumber(token.volume.h6)} | 24H: ${formatNumber(token.volume.h24)}
// 🔑Liquidity: ${formatNumber(token.liquidity.usd)} 

// Price Change:
// 5M: ${token.priceChange.m5}% | 1H: ${token.priceChange.h1}% | 6H: ${token.priceChange.h6}% | 24H: ${token.priceChange.h24}%

// ${socialLinks?`Links: \n${socialLinks}\n`:``}${websiteLinks?`${websiteLinks}\n \n`:``}💫 Dexscreener URL: ${token.url}
//         `;
// //         *New boost found for ${tokenDetails.baseToken.name} (${tokenDetails.baseToken.symbol}):*
// //             Token Address: ${token.tokenAddress}
// //             Total Boost: ${token.totalAmount}
// //             Call MC: ${formatNumber(tokenDetails.marketCap)}
// // First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}    
// //         Dexscreener URL: ${token.url}
//         user.tokensReceived.push({
//             tokenAddress: token.baseToken.address,
//             name: token.baseToken.name,
//             symbol: token.baseToken.symbol,
//             marketCap: token.marketCap,
//             websites: token.info.websites,
//             socials: token.info.socials,
//         });
//     } 
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

//     // Send message to the user if there's a message to send
//     if(process.env.NODE_ENV === "development"){
//         // Chat ID of MaestroSniperBot
// const chatId = '@MaestroSniperBot';

// // Function to send a message
// const sendMessage = (tokenAddress) => {
//     bot.sendMessage(chatId, `Token: ${tokenAddress}`)
//         .then(() => {
//             console.log('Message sent successfully to Maestro.');
//         })
//         .catch((error) => {
//             console.error('Failed to send message to Maestro:', error);
//         });
// };

// sendMessage(token.tokenAddress);

//     }
//     if (message) {        
//         try {            
//             // Send photo with caption using sendPhoto method
//             await bot.sendPhoto(user.chatId, imageUrl, {
//                 caption: message,
//                 parse_mode: 'Markdown',
//                 disable_web_page_preview: true
//             });

//             logger('Message with image sent successfully');
//             // await bot.sendMessage(user.chatId, `${token.tokenAddress}`, { parse_mode: 'Markdown', disable_web_page_preview: true });    
//             logger('Token Address sent successfully');
//             await user.save(); // Save user updates to MongoDB
//         } catch (error) {
//             // Handle errors here
//             console.log('Error sending message to user:', error);
//         }
//     }
// };
const sendNewTokenMessage = async (user, token) => {
    logger("Starting new token message send");

    // Token is from DexScreener API that gives latest token launches, User is User collection from MongoDB
    const formattedTokenAddress = formatTokenAddress(token.baseToken.address);

    const existingToken = user.tokensReceived.find(t => t.tokenAddress === token.baseToken.address);
    if (existingToken) {
        logger(`Existing token found for ${user.username || 'user'}: ${formattedTokenAddress}`);
        return;
    }

    // Find the token in the database
    let tokenFromDB;
    try {
        tokenFromDB = await Token.findOne({ tokenAddress: token.baseToken.address });
        logger(`Token fetched from DB: ${JSON.stringify(tokenFromDB)}`);
    } catch (error) {
        logger(`Error fetching token from DB: ${error}`);
        return;
    }

    // Log token to MongoDB first
    try {
        if (tokenFromDB) {
            // Update existing token details
            logger(`Updating existing token: ${formattedTokenAddress}`);
            tokenFromDB.name = token.baseToken.name;
            tokenFromDB.symbol = token.baseToken.symbol;
            tokenFromDB.marketCap = token.marketCap;
            // tokenFromDB.websites = token.info.websites;
            // tokenFromDB.socials = token.info.socials;
            tokenFromDB.firstFetchedAt = tokenFromDB.firstFetchedAt || Date.now(); // Only set if not already set
            
            await tokenFromDB.save();
            logger(`Token updated successfully: ${formattedTokenAddress}`);
        } else {
            // Create a new token entry with firstFetchedAt
            logger(`Creating new token: ${formattedTokenAddress}`);
            const newToken = new Token({
                tokenAddress: token.baseToken.address,                
                firstFetchedAt: new Date(), // Log the first fetched time
                name: token.baseToken.name,
                symbol: token.baseToken.symbol,
                marketCap: token.marketCap,
                // websites: token.info.websites,
                // socials: token.info.socials,
            });
            await newToken.save();
            tokenFromDB = newToken; // Use the new token for further operations
            logger(`New token created successfully: ${formattedTokenAddress}`);
        }
    } catch (error) {
        console.log('Error saving token:', error);
        logger(`Error saving token: ${error}`); // Enhanced logging
        return; // Exit the function if the token logging fails
    }

    let message = '';
    const imageUrl = token.profile.banner ? token.profile.banner : token.profile.icon; // Assume this URL comes from the Dex API
    
    // Other code continues...
    if (!existingToken) {
        // New token notification
        
const socials = token.info.socials || null;

// Check if there are any socials with a valid URL
const hasValidUrls = socials?.some(social => social.url);
let socialLinks = null;
// If no valid URLs are found, return null or handle accordingly
if (hasValidUrls) {
            // Loop through socials and generate the Markdown string
     socialLinks = socials?.map(social => {
    const type = social.type;  // Social type, e.g., "Twitter"
    const url = social.url;    // Social URL, e.g., "https://twitter.com/token"    
    // Return formatted MarkdownV2 link for each social
    return `🔗 [${type.charAt(0).toUpperCase() + type.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}

const websites = token.info.websites || null;

// Check if there are any socials with a valid URL
const hasValidWebsiteUrls = websites?.some(website => website.url);
let websiteLinks = null;
// If no valid URLs are found, return null or handle accordingly
if (hasValidWebsiteUrls) {
            // Loop through socials and generate the Markdown string
            websiteLinks = websites?.map(website => {
    const label = website.label;  
    const url = website.url;        
    // Return formatted MarkdownV2 link for each social
    return `🔗 [${label.charAt(0).toUpperCase() + label.slice(1)}](${url.replace(/_/g, '\\_')})`;
}).join('\n');
}


        message = `   
💎Newly Launched Gem Alert
🔗Chain: ${token.chainId.charAt(0).toUpperCase() + token.chainId.slice(1)}
💊Platform: ${token.dexId.charAt(0).toUpperCase() + token.dexId.slice(1)} 

💰${token.baseToken.name} (${token.baseToken.symbol})

${user.isAdmin?`First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}\n \n`:''}📝Token address: \`${token.baseToken.address}\`                         

💲Call Mc: ${formatNumber(token.marketCap)}
📛Volume:
5M: ${formatNumber(token.volume.m5)} | 1H: ${formatNumber(token.volume.h1)} | 6H: ${formatNumber(token.volume.h6)} | 24H: ${formatNumber(token.volume.h24)}
🔑Liquidity: ${formatNumber(token.liquidity.usd)} 

Price Change:
5M: ${token.priceChange.m5}% | 1H: ${token.priceChange.h1}% | 6H: ${token.priceChange.h6}% | 24H: ${token.priceChange.h24}%

${socialLinks?`Links: \n${socialLinks}\n`:``}${websiteLinks?`${websiteLinks}\n \n`:``}💫 Dexscreener URL: ${token.url}
        `;
//         *New boost found for ${token.baseToken.name} (${token.baseToken.symbol}):*
//             Token Address: ${token.tokenAddress}
//             Total Boost: ${token.totalAmount}
//             Call MC: ${formatNumber(token.marketCap)}
// First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}    
//         Dexscreener URL: ${token.url}
        user.tokensReceived.push({
            tokenAddress: token.baseToken.address,
            name: token.baseToken.name,
            symbol: token.baseToken.symbol,
            marketCap: token.marketCap,
            websites: token.info.websites,
            socials: token.info.socials,
        });
    } 
    // else if (existingToken.boostAmount !== token.totalAmount) {
    //     // Boost has changed, notify user
    //     message = `
    //         *Modified boost found for ${token.baseToken.name} (${token.baseToken.symbol}):*
    //         Token Address: ${token.tokenAddress}
    //         Call MC: ${formatNumber(token.marketCap)}
    //         Updated Boost: ${token.totalAmount}
    //         Previous Boost: ${existingToken.boostAmount}
    //         First Fetched At: ${new Date(tokenFromDB.firstFetchedAt).toUTCString()}
    //         Dexscreener URL: ${token.url}
    //     `;
    //     existingToken.boostAmount = token.totalAmount; // Update existing token's boost amount
    // }

//     // Send message to the user if there's a message to send
//     if(process.env.NODE_ENV === "development"){
//         // Chat ID of MaestroSniperBot
// const chatId = '@MaestroSniperBot';

// // Function to send a message
// const sendMessage = (tokenAddress) => {
//     bot.sendMessage(chatId, `Token: ${tokenAddress}`)
//         .then(() => {
//             console.log('Message sent successfully to Maestro.');
//         })
//         .catch((error) => {
//             console.error('Failed to send message to Maestro:', error);
//         });
// };

// sendMessage(token.tokenAddress);

//     }
    
    if (message) {        
        try {            
            // Send photo with caption using sendPhoto method
            await bot.sendPhoto(user.chatId, imageUrl, {
                caption: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: true
            });

            logger('Message with image sent successfully');
            await user.save(); // Save user updates to MongoDB
            logger('User data saved successfully');
        } catch (error) {
            console.log('Error sending message to user:', error);
            logger(`Error sending message to user: ${error}`);
        }
    }
};


module.exports = {
    sendTokenBoostMessage,
    sendNewTokenMessage    
};
