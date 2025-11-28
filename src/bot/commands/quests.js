const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { QuestModel, UserModel, UserQuestModel, ServerModel } = require('../../database/models');
const { QuestManager } = require('../utils/questManager');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quests')
        .setDescription('View available quests in this server'),

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
            .setTitle(`Quests in ${interaction.guild.name}`)
            .setDescription(`You have completed ${completedCount}/${config.quest.questsPerServer} quests in this server today.\n\n**How to complete a quest:**\nUse \`/complete <number>\` - Example: \`/complete 1\` to complete the first quest`);

        if (quests.length === 0) {
            embed.addFields({
                name: 'No Quests Available',
                value: 'Check back later for new quests.'
            });
        } else {
            quests.forEach((quest, index) => {
                const difficultyIcon = {
                    'easy': 'Easy',
                    'medium': 'Medium',
                    'hard': 'Hard'
                }[quest.difficulty] || quest.difficulty;

                const userQuest = user ? UserQuestModel.getUserQuests(user.id, interaction.guild.id).find(uq => uq.quest_id === quest.id) : null;
                const status = userQuest?.completed ? ' [COMPLETED]' : '';

                embed.addFields({
                    name: `${index + 1}. ${quest.quest_name}${status}`,
                    value: `${quest.description}\nDifficulty: ${difficultyIcon}\nRewards: ${quest.reward_currency} currency, ${quest.reward_gems} gems`
                });
            });

            embed.setFooter({ text: 'Use /complete <quest number> to complete a quest' });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
