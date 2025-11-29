const express = require('express');
const router = express.Router();
const { GlobalStatsModel, LeaderboardModel, ActivityLogModel, StaffModel } = require('../../database/models');

router.get('/stats', (req, res) => {
    try {
        const stats = GlobalStatsModel.get();
        const totalCurrency = GlobalStatsModel.getTotalCurrencyInCirculation();
        const totalGems = GlobalStatsModel.getTotalGemsInCirculation();

        res.json({
            totalServers: stats.total_servers,
            totalUsers: stats.total_users,
            totalQuestsCompleted: stats.total_quests_completed,
            totalCurrency: totalCurrency,
            totalGems: totalGems
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/leaderboard', (req, res) => {
    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const topPlayers = LeaderboardModel.getTopPlayers(month, year, 10);

        res.json({
            month: now.toLocaleString('default', { month: 'long' }),
            year: year,
            players: topPlayers
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/activity', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const activities = ActivityLogModel.getRecent(limit);

        res.json(activities);
    } catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/staff', (req, res) => {
    try {
        const staff = StaffModel.getAll();
        res.json(staff);
    } catch (error) {
        console.error('Error fetching staff:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
