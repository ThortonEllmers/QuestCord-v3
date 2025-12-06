const QuestService = require('../../services/gameEngine/QuestService');

/**
 * QuestController - Handles HTTP requests for quest-related operations
 *
 * Acts as a bridge between HTTP API and QuestService
 */
class QuestController {
    /**
     * Get active quests for a server
     * GET /api/v1/quests?serverId=xxx
     */
    static async getActiveQuests(req, res) {
        try {
            const { serverId } = req.query;

            if (!serverId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing serverId parameter'
                });
            }

            const result = await QuestService.getActiveQuests(serverId, 'web');

            if (!result.success) {
                const statusCode = result.type === 'not_opted_in' ? 403 : 404;
                return res.status(statusCode).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in getActiveQuests:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get user's quests for a server
     * GET /api/v1/quests/user?serverId=xxx
     */
    static async getUserQuests(req, res) {
        try {
            const { serverId } = req.query;

            if (!serverId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing serverId parameter'
                });
            }

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await QuestService.getUserQuests(req.user.discord_id, serverId, 'web');

            res.json(result);
        } catch (error) {
            console.error('Error in getUserQuests:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Accept a quest
     * POST /api/v1/quests/:questId/accept
     */
    static async acceptQuest(req, res) {
        try {
            const { questId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await QuestService.acceptQuest(req.user.discord_id, parseInt(questId), 'web');

            if (!result.success) {
                const statusCode = result.type === 'expired' ? 410 :
                                 result.type === 'already_completed' ? 409 : 400;
                return res.status(statusCode).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in acceptQuest:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Complete a quest
     * POST /api/v1/quests/:questId/complete
     */
    static async completeQuest(req, res) {
        try {
            const { questId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await QuestService.completeQuest(req.user.discord_id, parseInt(questId), 'web');

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in completeQuest:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Fail a quest
     * POST /api/v1/quests/:questId/fail
     */
    static async failQuest(req, res) {
        try {
            const { questId } = req.params;

            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await QuestService.failQuest(req.user.discord_id, parseInt(questId), 'web');

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in failQuest:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = QuestController;
