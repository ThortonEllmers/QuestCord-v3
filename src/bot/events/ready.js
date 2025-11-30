const { ActivityType } = require('discord.js');
const { ServerModel, GlobalStatsModel, UserModel } = require('../../database/models');
const { broadcastStats } = require('../../web/server');

// List of commands to cycle through in rich presence
const commands = [
    '/quests - View available quests',
    '/complete - Complete a quest',
    '/travel - Explore new servers',
    '/attack - Fight the boss',
    '/profile - View your stats',
    '/balance - Check your currency',
    '/leaderboard - See rankings',
    '/help - Get help',
    '/tutorial - Learn to play',
    '/boss - View boss status',
    '/rank - Check your rank'
];

let currentCommandIndex = 0;

module.exports = {
    name: 'clientReady',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        // Set initial presence
        updatePresence(client);

        // Cycle through commands every 2 minutes (120000ms)
        setInterval(() => updatePresence(client), 2 * 60 * 1000);

        await updateGuildStats(client);
        await updateUserDisplayNames(client);

        setInterval(() => updateGuildStats(client), 60000);
    }
};

function updatePresence(client) {
    const command = commands[currentCommandIndex];

    client.user.setPresence({
        activities: [{
            name: command,
            type: ActivityType.Playing
        }],
        status: 'online'
    });

    console.log(`[Presence] Updated to: ${command}`);

    // Move to next command
    currentCommandIndex = (currentCommandIndex + 1) % commands.length;
}

async function updateGuildStats(client) {
    try {
        const guilds = client.guilds.cache;
        let totalMembers = 0;

        for (const [guildId, guild] of guilds) {
            const memberCount = guild.memberCount;
            totalMembers += memberCount;

            ServerModel.create(guildId, guild.name, memberCount);
        }

        GlobalStatsModel.updateServerCount(guilds.size);
        GlobalStatsModel.updateUserCount(totalMembers);

        const stats = GlobalStatsModel.get();
        broadcastStats({
            totalServers: stats.total_servers,
            totalUsers: stats.total_users,
            totalQuestsCompleted: stats.total_quests_completed
        });

        console.log(`Stats updated: ${guilds.size} servers, ${totalMembers} total members`);
    } catch (error) {
        console.error('Error updating guild stats:', error);
    }
}

async function updateUserDisplayNames(client) {
    try {
        console.log('[Display Names] Starting update of user display names...');
        let updatedCount = 0;

        // Get all users from database
        const { db } = require('../../database/schema');
        const allUsers = db.prepare('SELECT discord_id, username FROM users').all();

        // Iterate through guilds to find and update users
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                // Fetch all members for this guild
                await guild.members.fetch();

                // Update each user's display name
                for (const user of allUsers) {
                    const member = guild.members.cache.get(user.discord_id);
                    if (member) {
                        const displayName = member.user.globalName || member.user.username;
                        if (displayName !== user.username) {
                            UserModel.create(user.discord_id, displayName);
                            updatedCount++;
                        }
                    }
                }
            } catch (err) {
                console.error(`Error fetching members for guild ${guild.name}:`, err);
            }
        }

        console.log(`[Display Names] Updated ${updatedCount} user display names`);
    } catch (error) {
        console.error('Error updating user display names:', error);
    }
}
