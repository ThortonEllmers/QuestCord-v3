const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available commands and helpful links'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle('📚 QuestCord Help & Commands')
            .setDescription('**Welcome to QuestCord!**\nYour adventure across Discord servers starts here.\n\n**🎮 Quick Start Guide:**\n1. Use `/quests` to see and accept quests\n2. Click the button to start your quest\n3. Complete the interactive task (combat, gathering, etc.)\n4. Use `/travel` to find more servers to quest in\n5. Use `/attack` when a boss spawns\n\n**Complete quests, defeat bosses, and climb the leaderboard!**')
            .addFields(
                {
                    name: '🎯 Getting Started',
                    value: '`/tutorial` - Complete interactive tutorial\n`/profile` - View your stats and progress\n`/help` - View this help menu',
                    inline: true
                },
                {
                    name: '⚔️ Questing',
                    value: '`/quests` - View and accept quests\n`/travel` - Find other servers\n`/rank` - Check your rank',
                    inline: true
                },
                {
                    name: '🐉 Combat',
                    value: '`/attack` - Attack active boss\n`/boss` - View boss status',
                    inline: true
                },
                {
                    name: '💰 Economy',
                    value: '`/balance` - Check currency/gems\n`/shop` - Browse item shop\n`/inventory` - View your items',
                    inline: true
                },
                {
                    name: '🏆 Competition',
                    value: '`/leaderboard` - Global rankings\n`/rank` - Your position',
                    inline: true
                },
                {
                    name: '⚙️ Server Settings',
                    value: '`/optin` - Enable quests (Owner)\n`/optout` - Disable quests (Owner)',
                    inline: true
                }
            )
            .addFields({
                name: '📖 Quest Types',
                value: '🗡️ **Combat** - Button mashing battle\n🌿 **Gathering** - Timed collection\n🗺️ **Exploration** - Multi-step journey\n📦 **Delivery** - Timed travel\n💬 **Social** - Instant completion'
            })
            .setFooter({ text: 'Use the buttons below for more information!' })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Add to Your Server')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('➕')
                    .setURL('https://discord.com/oauth2/authorize?client_id=1403949996868374558&permissions=2048&scope=bot%20applications.commands'),
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('💬')
                    .setURL('https://discord.gg/your-support-server'),
                new ButtonBuilder()
                    .setLabel('Website')
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🌐')
                    .setURL('https://questcord.fun')
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('help_tutorial')
                    .setLabel('Start Tutorial')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📖'),
                new ButtonBuilder()
                    .setCustomId('help_quests')
                    .setLabel('View Quests')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚔️'),
                new ButtonBuilder()
                    .setCustomId('help_profile')
                    .setLabel('My Profile')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('👤')
            );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }
};
