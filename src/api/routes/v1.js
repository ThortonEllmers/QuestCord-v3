const express = require('express');
const router = express.Router();
const { isAuthenticated, optionalAuth } = require('../../web/auth/discordOAuth');
const UserController = require('../controllers/UserController');
const QuestController = require('../controllers/QuestController');
const BossController = require('../controllers/BossController');
const LoginController = require('../controllers/LoginController');

/**
 * API v1 Routes
 *
 * RESTful API endpoints for the QuestCord platform
 */

// ============================================================================
// User Routes
// ============================================================================

// Get current user (requires authentication)
router.get('/users/me', isAuthenticated, UserController.getMe);

// Get user profile (public)
router.get('/users/:userId', optionalAuth, UserController.getProfile);

// Get user stats (public)
router.get('/users/:userId/stats', optionalAuth, UserController.getStats);

// Update user profile (requires authentication)
router.patch('/users/:userId', isAuthenticated, UserController.updateProfile);

// ============================================================================
// Quest Routes
// ============================================================================

// Get active quests for a server (public)
router.get('/quests', optionalAuth, QuestController.getActiveQuests);

// Get user's quests (requires authentication)
router.get('/quests/user', isAuthenticated, QuestController.getUserQuests);

// Accept a quest (requires authentication)
router.post('/quests/:questId/accept', isAuthenticated, QuestController.acceptQuest);

// Complete a quest (requires authentication)
router.post('/quests/:questId/complete', isAuthenticated, QuestController.completeQuest);

// Fail a quest (requires authentication)
router.post('/quests/:questId/fail', isAuthenticated, QuestController.failQuest);

// ============================================================================
// Boss Routes
// ============================================================================

// Get active boss (public)
router.get('/bosses/active', optionalAuth, BossController.getActiveBoss);

// Get boss participants (public)
router.get('/bosses/:bossId/participants', optionalAuth, BossController.getBossParticipants);

// Attack a boss (requires authentication)
router.post('/bosses/:bossId/attack', isAuthenticated, BossController.attackBoss);

// Spawn a boss (admin only - TODO: add admin middleware)
router.post('/bosses/spawn', isAuthenticated, BossController.spawnBoss);

// ============================================================================
// Daily Login Rewards Routes
// ============================================================================

// Check if user can claim daily reward (requires authentication)
router.get('/daily/check', isAuthenticated, LoginController.checkDailyReward);

// Claim daily reward (requires authentication)
router.post('/daily/claim', isAuthenticated, LoginController.claimDailyReward);

// Get all reward tiers (public)
router.get('/daily/rewards', LoginController.getAllRewards);

// Get user's login statistics (requires authentication)
router.get('/daily/stats', isAuthenticated, LoginController.getLoginStats);

// ============================================================================
// Health Check
// ============================================================================

router.get('/health', (req, res) => {
    res.json({
        success: true,
        service: 'QuestCord API',
        version: 'v1',
        timestamp: Date.now()
    });
});

module.exports = router;
