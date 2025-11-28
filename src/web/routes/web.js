const express = require('express');
const router = express.Router();
const { GlobalStatsModel, LeaderboardModel, StaffModel } = require('../../database/models');
const config = require('../../../config.json');

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
        const now = new Date();
        const topPlayers = LeaderboardModel.getTopPlayers(now.getMonth() + 1, now.getFullYear(), 10);
        const staff = StaffModel.getAll();

        res.render('index', {
            stats,
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
