const { StaffModel } = require('../../database/models');
const config = require('../../../config.json');

async function updateStaffRoles(client, broadcastCallback) {
    try {
        const supportGuild = client.guilds.cache.get(config.supportServer.id);
        if (!supportGuild) {
            console.log('Support server not found');
            return null;
        }

        await supportGuild.members.fetch();

        const developerRole = supportGuild.roles.cache.get(config.supportServer.roles.developer);
        const staffRole = supportGuild.roles.cache.get(config.supportServer.roles.staff);

        if (developerRole) {
            for (const [memberId, member] of developerRole.members) {
                const avatarUrl = member.user.displayAvatarURL({ size: 128, extension: 'png' });
                const displayName = member.user.globalName || member.user.username;
                StaffModel.add(memberId, member.displayName, 'Developer', avatarUrl);

                // Also update the user record to ensure display name is current
                const { UserModel } = require('../../database/models');
                const user = UserModel.findByDiscordId(memberId);
                if (user) {
                    UserModel.create(memberId, displayName); // Updates on conflict
                }
            }
        }

        if (staffRole) {
            for (const [memberId, member] of staffRole.members) {
                if (!developerRole || !member.roles.cache.has(config.supportServer.roles.developer)) {
                    const avatarUrl = member.user.displayAvatarURL({ size: 128, extension: 'png' });
                    const displayName = member.user.globalName || member.user.username;
                    StaffModel.add(memberId, member.displayName, 'Staff', avatarUrl);

                    // Also update the user record to ensure display name is current
                    const { UserModel } = require('../../database/models');
                    const user = UserModel.findByDiscordId(memberId);
                    if (user) {
                        UserModel.create(memberId, displayName); // Updates on conflict
                    }
                }
            }
        }

        const allStaff = StaffModel.getAll();

        if (broadcastCallback && typeof broadcastCallback === 'function') {
            broadcastCallback(allStaff);
        }

        console.log('Staff roles updated successfully');
        return allStaff;
    } catch (error) {
        console.error('Error updating staff roles:', error);
        return null;
    }
}

function checkStaffRole(req, res, next) {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const staff = StaffModel.findByDiscordId(userId);

    if (!staff) {
        return res.status(403).json({ error: 'Forbidden - Staff access required' });
    }

    req.staff = staff;
    next();
}

module.exports = { updateStaffRoles, checkStaffRole };
