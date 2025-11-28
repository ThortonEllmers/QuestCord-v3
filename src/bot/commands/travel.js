const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ServerModel, UserModel } = require('../../database/models');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travel')
        .setDescription('View available servers to travel to for more quests'),

    async execute(interaction) {
        let user = UserModel.findByDiscordId(interaction.user.id);

        if (!user) {
            UserModel.create(interaction.user.id, interaction.user.username);
            user = UserModel.findByDiscordId(interaction.user.id);
        }

        const servers = ServerModel.getOptedInServers();
        const userServers = interaction.client.guilds.cache.filter(g =>
            g.members.cache.has(interaction.user.id)
        );

        const availableServers = servers.filter(s =>
            userServers.has(s.discord_id)
        );

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle('Available Servers')
            .setDescription('**How questing works:**\n1. You can complete 5 quests per server each day\n2. Use `/quests` in any server below to see available quests\n3. Use `/complete <number>` to complete a quest\n4. Travel to other servers for more quests!\n\n**Your Available Servers:**');

        if (availableServers.length === 0) {
            embed.addFields({
                name: 'No Servers Available',
                value: 'Join more servers with QuestCord enabled or ask server owners to use `/optin`.'
            });
        } else {
            const serverList = availableServers.map(s => {
                const guild = interaction.client.guilds.cache.get(s.discord_id);
                const currentLocation = user.current_server_id === s.discord_id ? ' [CURRENT]' : '';
                return `**${s.name}**${currentLocation}\nMembers: ${s.member_count.toLocaleString()} | Quests Completed: ${s.total_quests_completed.toLocaleString()}`;
            }).join('\n\n');

            embed.addFields({
                name: 'Servers',
                value: serverList
            });
        }

        embed.setFooter({ text: 'Use /quests in any server to start questing' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
};
