const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserModel, QuestModel, UserQuestModel, ServerModel, GlobalStatsModel, LeaderboardModel } = require('../../database/models');
const { LevelSystem } = require('../../utils/levelSystem');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('complete')
        .setDescription('Complete a quest')
        .addIntegerOption(option =>
            option.setName('quest')
                .setDescription('Quest number to complete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(5)
        ),

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
                content: 'This server has not opted in to the quest system.',
                ephemeral: true
            });
        }

        const questNumber = interaction.options.getInteger('quest');
        const quests = QuestModel.getActiveQuestsByServer(interaction.guild.id);

        if (questNumber > quests.length) {
            return interaction.reply({
                content: `Invalid quest number. This server has ${quests.length} quests available.`,
                ephemeral: true
            });
        }

        const quest = quests[questNumber - 1];
        let user = UserModel.findByDiscordId(interaction.user.id);

        if (!user) {
            UserModel.create(interaction.user.id, interaction.user.username);
            user = UserModel.findByDiscordId(interaction.user.id);
        }

        const existingQuest = UserQuestModel.getUserQuests(user.id, interaction.guild.id).find(uq => uq.quest_id === quest.id);

        if (existingQuest && existingQuest.completed) {
            return interaction.reply({
                content: 'You have already completed this quest today.',
                ephemeral: true
            });
        }

        const completedCount = UserQuestModel.getCompletedCount(user.id, interaction.guild.id);
        if (completedCount >= config.quest.questsPerServer) {
            return interaction.reply({
                content: `You have completed all ${config.quest.questsPerServer} quests in this server today. Use \`/travel\` to visit another server.`,
                ephemeral: true
            });
        }

        if (!existingQuest) {
            UserQuestModel.assignQuest(user.id, quest.id);
        }

        UserQuestModel.completeQuest(user.id, quest.id);
        UserModel.updateCurrency(interaction.user.id, quest.reward_currency);
        UserModel.updateGems(interaction.user.id, quest.reward_gems);
        UserModel.incrementQuestCount(interaction.user.id);
        ServerModel.incrementQuestCount(interaction.guild.id);
        GlobalStatsModel.incrementQuestCount();

        const now = new Date();
        LeaderboardModel.updateScore(user.id, quest.reward_currency + (quest.reward_gems * 10), now.getMonth() + 1, now.getFullYear());

        const questExp = LevelSystem.getQuestExperience(quest.difficulty);
        const levelResult = LevelSystem.addExperience(user.level, user.experience, user.total_experience, questExp);
        UserModel.updateLevel(interaction.user.id, levelResult.newLevel, levelResult.newCurrentExp, levelResult.newTotalExp);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.success)
            .setTitle('Quest Completed')
            .setDescription(`**${quest.quest_name}**\n${quest.description}`)
            .addFields(
                {
                    name: 'Rewards',
                    value: `+${quest.reward_currency} currency\n+${quest.reward_gems} gems\n+${questExp} XP`
                },
                {
                    name: 'Progress',
                    value: `${completedCount + 1}/${config.quest.questsPerServer} quests completed in this server today`
                }
            );

        if (levelResult.leveledUp) {
            const rewards = LevelSystem.getLevelRewards(levelResult.newLevel);
            UserModel.updateCurrency(interaction.user.id, rewards.currency);
            UserModel.updateGems(interaction.user.id, rewards.gems);

            embed.addFields({
                name: `Level Up! ${user.level} → ${levelResult.newLevel}`,
                value: `You reached level ${levelResult.newLevel}!\n+${rewards.currency} currency\n+${rewards.gems} gems`
            });
        } else {
            const progressBar = LevelSystem.getProgressBar(levelResult.newCurrentExp, levelResult.requiredExp);
            embed.addFields({
                name: `Level ${levelResult.newLevel}`,
                value: `${progressBar} ${levelResult.newCurrentExp}/${levelResult.requiredExp} XP`
            });
        }

        embed.setFooter({ text: 'Keep questing to level up and climb the leaderboard' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
