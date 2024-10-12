const axios = require('axios');
const { logger } = require('../utils/logger');
const BOOSTS_URL = 'https://api.dexscreener.com/token-boosts/latest/v1';
const BOOST_THRESHOLD = 400;
const BOOST_CHAIN_ID = 'solana';

const getTokensWithBoostsOverThreshold = async () => {
    try {
        logger(`Fetching token boosts from ${BOOSTS_URL}...`);
        const response = await axios.get(BOOSTS_URL);

        if (response.status === 200) {
            const tokens = response.data;
            const filteredTokens = tokens.filter(token =>
                token.totalAmount >= BOOST_THRESHOLD && token.chainId === BOOST_CHAIN_ID
            );
            logger(`${filteredTokens.length} tokens found over the threshold.`);
            return filteredTokens;
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
