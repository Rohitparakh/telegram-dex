const axios = require('axios');
const { logger } = require('../utils/logger');

// API URL for fetching token boosts
const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';

// Boost thresholds for different chains
const BOOST_THRESHOLD_SOLANA = 400;
const BOOST_THRESHOLD_SUI = 100;

// Chain IDs for Solana and Sui
const BOOST_CHAIN_ID_SOLANA = 'solana';
const BOOST_CHAIN_ID_SUI = 'sui';

// Fetch tokens with boosts over the defined threshold for Solana and Sui
const getTokensWithBoostsOverThreshold = async () => {
    try {
        logger(`Fetching token boosts from ${BOOSTS_URL}...`);
        const response = await axios.get(BOOSTS_URL);

        if (response.status === 200) {
            const tokens = response.data;

            // Filter tokens based on chain and threshold for Solana
            const filteredSolanaTokens = tokens.filter(token =>
                token.totalAmount >= BOOST_THRESHOLD_SOLANA && token.chainId === BOOST_CHAIN_ID_SOLANA
            );

            // Filter tokens based on chain and threshold for Sui
            const filteredSuiTokens = tokens.filter(token =>
                token.totalAmount >= BOOST_THRESHOLD_SUI && token.chainId === BOOST_CHAIN_ID_SUI
            );

            logger(`${filteredSolanaTokens.length} Solana tokens found over the threshold.`);
            logger(`${filteredSuiTokens.length} Sui tokens found over the threshold.`);

            // Return combined results from both chains
            return [...filteredSolanaTokens, ...filteredSuiTokens];
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
    getTokensWithBoostsOverThreshold
};
