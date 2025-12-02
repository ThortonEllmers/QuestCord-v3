const express = require('express');
const router = express.Router();
const { GlobalStatsModel, LeaderboardModel, StaffModel } = require('../../database/models');
const config = require('../../../config.json');
const insults = require('../../../config/insults.json');
const websiteEffects = require('../../../config/website-effects.json');

// Simple in-memory rate limiter for insults
const insultRateLimits = new Map();
const RATE_LIMIT_WINDOW = 2000; // 2 seconds
const MAX_REQUESTS = 1; // 1 request per window

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

// Random insult endpoint with rate limiting
router.get('/api/insult', (req, res) => {
    try {
        // Rate limiting by IP
        const clientIp = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const rateLimitData = insultRateLimits.get(clientIp);

        if (rateLimitData) {
            const timeSinceLastRequest = now - rateLimitData.lastRequest;

            if (timeSinceLastRequest < RATE_LIMIT_WINDOW) {
                // Too many requests
                const waitTime = Math.ceil((RATE_LIMIT_WINDOW - timeSinceLastRequest) / 1000);
                return res.status(429).json({
                    insult: `Slow down! Wait ${waitTime} seconds before requesting another insult.`
                });
            }
        }

        // Update rate limit data
        insultRateLimits.set(clientIp, {
            lastRequest: now,
            count: 1
        });

        // Clean up old rate limit entries (older than 5 minutes)
        const fiveMinutesAgo = now - 300000;
        for (const [ip, data] of insultRateLimits.entries()) {
            if (data.lastRequest < fiveMinutesAgo) {
                insultRateLimits.delete(ip);
            }
        }

        // Check if insults array exists and has items
        if (!insults.insults || insults.insults.length === 0) {
            return res.json({ insult: 'No insults configured yet. Add some to config/insults.json!' });
        }

        const randomInsult = insults.insults[Math.floor(Math.random() * insults.insults.length)];

        // Check if we got a valid insult
        if (!randomInsult || randomInsult.trim() === '') {
            return res.json({ insult: 'Error: Empty insult in config!' });
        }

        res.json({ insult: randomInsult });
    } catch (error) {
        console.error('Error fetching insult:', error);
        res.json({ insult: 'Error loading insult. Check server logs.' });
    }
});

// Make People Cry prank page
router.get('/makepeoplecry', (req, res) => {
    res.render('makepeoplecry');
});

// Terms of Service page
router.get('/terms', (req, res) => {
    res.render('terms');
});

// Privacy Policy page
router.get('/privacy', (req, res) => {
    res.render('privacy');
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

        // Fetch peasants
        const peasantIds = ['245784383506743296', '576244740199284779'];
        const peasants = [];
        const { getDiscordClient } = require('../server');
        const client = getDiscordClient();

        if (client) {
            for (const userId of peasantIds) {
                try {
                    const user = await client.users.fetch(userId);
                    if (user) {
                        peasants.push({
                            discord_id: userId,
                            username: user.globalName || user.username,
                            avatar_url: user.displayAvatarURL({ size: 128, extension: 'png' }),
                            role: 'Peasant'
                        });
                    }
                } catch (error) {
                    console.error(`Error fetching peasant user ${userId}:`, error);
                }
            }
        }

        res.render('index', {
            stats: enhancedStats,
            topPlayers,
            staff,
            peasants,
            config,
            websiteEffects
        });
    } catch (error) {
        console.error('Error rendering index:', error);
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
