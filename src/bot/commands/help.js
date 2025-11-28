const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle('QuestCord Commands')
            .setDescription('**Quick Start Guide:**\n1. Use `/quests` to see available quests\n2. Use `/complete 1` to complete quest #1\n3. Use `/travel` to find more servers to quest in\n4. Use `/attack` when a boss spawns\n\nComplete quests, defeat bosses, and climb the leaderboard!')
            .addFields(
                {
                    name: 'Getting Started',
                    value: '`/tutorial` - Full tutorial on how to play\n`/profile` - View your stats and progress'
                },
                {
                    name: 'Questing',
                    value: '`/quests` - View available quests in this server\n`/complete <quest>` - Complete a quest\n`/travel <server>` - Travel to another server'
                },
                {
                    name: 'Combat',
                    value: '`/attack` - Attack the active boss\n`/boss` - View current boss status'
                },
                {
                    name: 'Economy',
                    value: '`/balance` - Check your currency and gems\n`/shop` - Browse the item shop\n`/inventory` - View your items'
                },
                {
                    name: 'Leaderboard',
                    value: '`/leaderboard` - View the global leaderboard\n`/rank` - Check your current rank'
                },
                {
                    name: 'Server Management',
                    value: '`/optin` - Enable quests in this server (Owner)\n`/optout` - Disable quests in this server (Owner)'
                },
                {
                    name: 'Staff Commands',
                    value: '`/admin` - Staff-only data management commands'
                }
            )
            .setFooter({ text: 'QuestCord - Quest across the Discord universe' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
