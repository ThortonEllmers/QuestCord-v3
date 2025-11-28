const { GlobalStatsModel } = require('../../database/models');

module.exports = {
    name: 'guildDelete',
    async execute(guild) {
        console.log(`Left server: ${guild.name} (${guild.id})`);

        const totalServers = guild.client.guilds.cache.size;
        GlobalStatsModel.updateServerCount(totalServers);
    }
};
