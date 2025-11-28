const { ServerModel, GlobalStatsModel } = require('../../database/models');

module.exports = {
    name: 'guildCreate',
    async execute(guild) {
        console.log(`Joined new server: ${guild.name} (${guild.id})`);

        ServerModel.create(guild.id, guild.name, guild.memberCount);

        const totalServers = guild.client.guilds.cache.size;
        GlobalStatsModel.updateServerCount(totalServers);
    }
};
