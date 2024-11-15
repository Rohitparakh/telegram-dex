const axios = require('axios');
const { logger } = require('../utils/logger');

// API URL for fetching token boosts
const BOOSTS_URL = 'https://api.dexscreener.com/token-profiles/latest/v1';
const TOKEN_DETAILS_URL = 'https://api.dexscreener.com/latest/dex/tokens';
const MARKET_CAP_THRESHOLD = 80000;
const LIQUIDITY_THRESHOLD = 5000;
// Boost thresholds for different chains
// const BOOST_THRESHOLD_SOLANA = 400;
// const BOOST_THRESHOLD_SUI = 100;

// Chain IDs for Solana and Sui
const BOOST_CHAIN_ID_SOLANA = 'solana';
// const BOOST_CHAIN_ID_SUI = 'sui';

// Boolean variables to control filtering for Solana and Sui tokens
const includeSolanaTokens = true; // Set to true if you want to include Solana tokens
// const includeSuiTokens = false;   // Set to true if you want to include Sui tokens

const getMCL = async (tokenAddress) => {
    const response = await axios.get(`${TOKEN_DETAILS_URL}/${tokenAddress}`);  
    return {
        marketCap:response.data.pairs[0].marketCap,
        liquidity: response.data.pairs[0].liquidity.usd
    }
}

// Fetch tokens with boosts over the defined threshold for Solana and Sui
const getNewTokens = async () => {
    try {
        // logger(`Fetching token boosts from ${BOOSTS_URL}...`);
        // logger(`PROCESS ENV: ${process.env.NODE_ENV}`);
        // logger(`TG BOT TOKEN: ${process.env.TELEGRAM_BOT_TOKEN}`);
        const response = await axios.get(BOOSTS_URL);

        if (response.status === 200) {
            const tokens = response.data;
            let filteredSolanaTokens = [];
            // Filter tokens based on chain and threshold for Solana
            if (includeSolanaTokens) {
                 filteredSolanaTokens = (
                    await Promise.all(
                        tokens.map(async (token) => {
                            const tokenDetails = await getMCL(token.tokenAddress);
                            const { marketCap, liquidity } = tokenDetails;
                            if(marketCap <= MARKET_CAP_THRESHOLD && liquidity >= LIQUIDITY_THRESHOLD) {
                                token.marketCap = marketCap;
                                token.liquidity = liquidity;
                                return token
                            } else{
                                return null
                            }
                            
                        })
                    )
                ).filter((token) => token !== null); // Filter out null values
            }
            
            
            // if(includeSolanaTokens){
            //     filteredSolanaTokens = tokens.filter(async (token) =>{
            //         let marketCap = await getMarketCap(token.tokenAddress);
            //         if (marketCap <= MARKET_CAP_THRESHOLD){
            //             return token;
            //         }
            //     }
            //     );
            // }

            // console.log(filteredSolanaTokens)

            logger(`${filteredSolanaTokens?.length} Solana tokens found over the threshold.`);
            console.log(filteredSolanaTokens)

            // Return combined results from both chains
            return filteredSolanaTokens;
        } else {
            logger(`Error fetching token boosts: ${response.status}`);
            return [];
        }
    } catch (error) {
        logger(`Error occurred: ${error.message}`);
        return [];
    }
};


module.exports = {
    getNewTokens
};
