const express = require('express');
const router = express.Router();
const { GlobalStatsModel, LeaderboardModel, StaffModel } = require('../../database/models');
const config = require('../../../config.json');

// Helper function to format large numbers with abbreviations
function formatLargeNumber(num) {
    if (num >= 1e15) { // Quadrillion
        return (num / 1e15).toFixed(1).replace(/\.0$/, '') + 'Q';
    }
    if (num >= 1e12) { // Trillion
        return (num / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    }
    if (num >= 1e9) { // Billion
        return (num / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1e6) { // Million
        return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1e3) { // Thousand
        return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toLocaleString();
}

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        service: 'QuestCord Web Server'
    });
});

router.get('/', async (req, res) => {
    try {
        const stats = GlobalStatsModel.get();
        const totalCurrency = GlobalStatsModel.getTotalCurrencyInCirculation();
        const totalGems = GlobalStatsModel.getTotalGemsInCirculation();

        // Add currency and gems to stats object with formatted values
        const enhancedStats = {
            ...stats,
            total_currency: totalCurrency,
            total_gems: totalGems,
            total_currency_formatted: formatLargeNumber(totalCurrency),
            total_gems_formatted: formatLargeNumber(totalGems)
        };

        const now = new Date();
        const topPlayers = LeaderboardModel.getTopPlayers(now.getMonth() + 1, now.getFullYear(), 10);
        const staff = StaffModel.getAll();

        res.render('index', {
            stats: enhancedStats,
            topPlayers,
            staff,
            config
        });
    } catch (error) {
        console.error('Error rendering index:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
