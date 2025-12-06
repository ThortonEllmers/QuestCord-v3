const UserService = require('../../services/gameEngine/UserService');

/**
 * UserController - Handles HTTP requests for user-related operations
 *
 * Acts as a bridge between HTTP API and UserService
 */
class UserController {
    /**
     * Get user profile
     * GET /api/v1/users/:userId
     */
    static async getProfile(req, res) {
        try {
            const { userId } = req.params;

            const result = await UserService.getUserProfile(userId, 'web');

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get user stats
     * GET /api/v1/users/:userId/stats
     */
    static async getStats(req, res) {
        try {
            const { userId } = req.params;

            const result = await UserService.getUserStats(userId, 'web');

            if (!result.success) {
                return res.status(404).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in getStats:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Update user profile
     * PATCH /api/v1/users/:userId
     */
    static async updateProfile(req, res) {
        try {
            const { userId } = req.params;
            const updates = req.body;

            // Ensure user can only update their own profile
            if (req.user && req.user.discord_id !== userId) {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden',
                    message: 'You can only update your own profile'
                });
            }

            const result = await UserService.updateProfile(userId, updates, 'web');

            if (!result.success) {
                return res.status(400).json(result);
            }

            res.json(result);
        } catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get current authenticated user
     * GET /api/v1/users/me
     */
    static async getMe(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Not authenticated'
                });
            }

            const result = await UserService.getUserProfile(req.user.discord_id, 'web');

            res.json(result);
        } catch (error) {
            console.error('Error in getMe:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

module.exports = UserController;
