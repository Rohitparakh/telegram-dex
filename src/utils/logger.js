const logger = (message) => {
    console.log(`[LOG - ${new Date().toISOString()}]: ${message}`);
};

const formatTokenAddress = (address) => {
    return `${address.slice(0, 4)}...${address.slice(-5)}`;
};

function formatNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(1) + 'B'; // Billions
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(1) + 'M'; // Millions
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(1) + 'K'; // Thousands
    } else {
        return num.toString(); // Less than 1000
    }
}

module.exports = {
    logger,
    formatTokenAddress,
    formatNumber
};
