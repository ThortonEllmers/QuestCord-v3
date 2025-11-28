const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { QuestModel, UserModel, UserQuestModel, ServerModel } = require('../../database/models');
const { QuestManager } = require('../utils/questManager');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('View and accept available quests in this server'),

    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({
                content: 'This command can only be used in a server.',
                ephemeral: true
            });
        }

        const server = ServerModel.findByDiscordId(interaction.guild.id);
        if (!server || !server.opted_in) {
            return interaction.reply({
                content: 'This server has not opted in to the quest system. Ask a server administrator to use `/optin`.',
                ephemeral: true
            });
        }

        let quests = QuestModel.getActiveQuestsByServer(interaction.guild.id);

        if (quests.length === 0) {
            quests = QuestManager.assignInitialQuests(interaction.guild.id, interaction.guild.name);
        }

        const user = UserModel.findByDiscordId(interaction.user.id);
        const completedCount = user ? UserQuestModel.getCompletedCount(user.id, interaction.guild.id) : 0;

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle(`📜 Quests in ${interaction.guild.name}`)
            .setDescription(`You have completed **${completedCount}/${config.quest.questsPerServer}** quests in this server today.\n\n**How to accept a quest:**\nClick the button below the quest you want to accept. Different quest types have different completion mechanics:\n\n🗡️ **Combat** - Battle minigame\n🌿 **Gathering** - Timed collection\n🗺️ **Exploration** - Journey through locations\n📦 **Delivery** - Timed travel\n💬 **Social** - Instant completion`);

        if (quests.length === 0) {
            embed.addFields({
                name: 'No Quests Available',
                value: 'Check back later for new quests.'
            });
            return interaction.reply({ embeds: [embed] });
        }

        const questFields = [];
        const buttons = [];

        quests.forEach((quest, index) => {
            const difficultyEmoji = {
                'easy': '⭐',
                'medium': '⭐⭐',
                'hard': '⭐⭐⭐'
            }[quest.difficulty] || '⭐';

            const typeEmoji = {
                'combat': '🗡️',
                'gathering': '🌿',
                'exploration': '🗺️',
                'delivery': '📦',
                'social': '💬'
            }[quest.type] || '📋';

            const userQuest = user ? UserQuestModel.getUserQuests(user.id, interaction.guild.id).find(uq => uq.quest_id === quest.id) : null;
            const status = userQuest?.completed ? ' ✅' : '';

            embed.addFields({
                name: `${typeEmoji} ${quest.quest_name}${status}`,
                value: `${quest.description}\n${difficultyEmoji} Difficulty: ${quest.difficulty}\n💰 Rewards: ${quest.reward_currency} currency, ${quest.reward_gems} gems`,
                inline: false
            });

            if (!userQuest || !userQuest.completed) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId(`accept_quest_${quest.id}`)
                        .setLabel(`Accept Quest ${index + 1}`)
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji(typeEmoji)
                );
            }
        });

        embed.setFooter({ text: 'Click a button below to accept and start a quest!' });

        const components = [];
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 5));
            components.push(row);
        }

        await interaction.reply({ embeds: [embed], components });
    }
};
