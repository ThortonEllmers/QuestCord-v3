const { ActivityType } = require('discord.js');
const { ServerModel, GlobalStatsModel } = require('../../database/models');
const { broadcastStats } = require('../../web/server');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}`);

        client.user.setPresence({
            activities: [{
                name: 'Quests across servers',
                type: ActivityType.Playing
            }],
            status: 'online'
        });

        await updateGuildStats(client);

        setInterval(() => updateGuildStats(client), 60000);
    }
};

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
