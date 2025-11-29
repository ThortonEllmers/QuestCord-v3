const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BossModel, BossParticipantModel, UserModel, LeaderboardModel } = require('../../database/models');
const { BossManager } = require('../utils/bossManager');
const { LevelSystem } = require('../../utils/levelSystem');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('attack')
        .setDescription('Attack the active boss'),

    async execute(interaction) {
        const boss = BossModel.getActiveBoss();

        if (!boss) {
            return interaction.reply({
                content: 'There is no active boss to attack right now. Check back later.',
                ephemeral: true
            });
        }

        const status = BossManager.getBossStatus(boss);

        if (!status.isAlive) {
            return interaction.reply({
                content: 'This boss has already been defeated.',
                ephemeral: true
            });
        }

        let user = UserModel.findByDiscordId(interaction.user.id);
        if (!user) {
            UserModel.create(interaction.user.id, interaction.user.username);
            user = UserModel.findByDiscordId(interaction.user.id);
        }

        const baseDamage = 100;
        const randomFactor = Math.random() * 0.5 + 0.75;
        const damage = Math.floor(baseDamage * randomFactor);

        BossParticipantModel.addParticipant(boss.id, user.id);
        BossParticipantModel.addDamage(boss.id, user.id, damage);
        BossModel.dealDamage(boss.id, damage);

        const updatedBoss = BossModel.findById(boss.id);
        const newStatus = BossManager.getBossStatus(updatedBoss);

        if (updatedBoss.health <= 0 && !updatedBoss.defeated) {
            BossModel.defeatBoss(boss.id);

            const participants = BossParticipantModel.getParticipants(boss.id);
            const topDealer = BossParticipantModel.getTopDamageDealer(boss.id);
            const bossExp = LevelSystem.getBossExperience(boss.max_health);

            for (const participant of participants) {
                const isTopDealer = participant.user_id === topDealer.user_id;
                const currencyReward = isTopDealer ? Math.floor(boss.reward_currency * 1.5) : boss.reward_currency;
                const gemReward = isTopDealer ? Math.floor(boss.reward_gems * 1.5) : boss.reward_gems;
                const expReward = isTopDealer ? Math.floor(bossExp * 1.5) : bossExp;

                UserModel.updateCurrency(participant.discord_id, currencyReward);
                UserModel.updateGems(participant.discord_id, gemReward);

                const participantUser = UserModel.findByDiscordId(participant.discord_id);
                if (participantUser) {
                    const levelResult = LevelSystem.addExperience(participantUser.level, participantUser.experience, participantUser.total_experience, expReward);
                    UserModel.updateLevel(participant.discord_id, levelResult.newLevel, levelResult.newCurrentExp, levelResult.newTotalExp);

                    if (levelResult.leveledUp) {
                        const rewards = LevelSystem.getLevelRewards(levelResult.newLevel);
                        UserModel.updateCurrency(participant.discord_id, rewards.currency);
                        UserModel.updateGems(participant.discord_id, rewards.gems);
                    }
                }

                const now = new Date();
                LeaderboardModel.updateScore(participant.user_id, currencyReward + (gemReward * 10), now.getMonth() + 1, now.getFullYear());
            }

            const isTopDealer = topDealer.user_id === user.id;
            const userExpReward = isTopDealer ? Math.floor(bossExp * 1.5) : bossExp;

            const updatedUser = UserModel.findByDiscordId(interaction.user.id);
            const levelResult = LevelSystem.addExperience(updatedUser.level, updatedUser.experience, updatedUser.total_experience, userExpReward);

            const defeatEmbed = new EmbedBuilder()
                .setColor(config.theme.colors.success)
                .setTitle('Boss Defeated')
                .setDescription(`**${boss.boss_name}** has been defeated!\n\nTop Damage Dealer: ${topDealer.username}`)
                .addFields(
                    {
                        name: 'Your Rewards',
                        value: `+${isTopDealer ? Math.floor(boss.reward_currency * 1.5) : boss.reward_currency} Dakari\n+${isTopDealer ? Math.floor(boss.reward_gems * 1.5) : boss.reward_gems} gems\n+${userExpReward} XP`
                    },
                    {
                        name: 'Total Participants',
                        value: participants.length.toString()
                    }
                );

            if (levelResult.leveledUp) {
                defeatEmbed.addFields({
                    name: `Level Up! ${updatedUser.level} → ${levelResult.newLevel}`,
                    value: `You reached level ${levelResult.newLevel}!`
                });
            }

            defeatEmbed.setFooter({ text: 'The next boss will spawn soon' })
                .setTimestamp();

            return interaction.reply({ embeds: [defeatEmbed] });
        }

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle(`Attacking ${boss.boss_name}`)
            .setDescription(`You dealt ${damage} damage`)
            .addFields(
                {
                    name: 'Boss Health',
                    value: `${updatedBoss.health.toLocaleString()} / ${boss.max_health.toLocaleString()} (${newStatus.healthPercent}%)`,
                    inline: true
                },
                {
                    name: 'Time Remaining',
                    value: `${newStatus.minutesRemaining} minutes`,
                    inline: true
                }
            )
            .setFooter({ text: 'Keep attacking to defeat the boss' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
