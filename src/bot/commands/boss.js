const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { BossModel, BossParticipantModel } = require('../../database/models');
const { BossManager } = require('../utils/bossManager');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boss')
        .setDescription('View the active boss status'),

    async execute(interaction) {
        const boss = BossModel.getActiveBoss();

        if (!boss) {
            return interaction.reply({
                content: 'There is no active boss right now. Check back later.',
                ephemeral: true
            });
        }

        const status = BossManager.getBossStatus(boss);
        const participants = BossParticipantModel.getParticipants(boss.id);
        const topDamagers = participants.slice(0, 5);

        const embed = new EmbedBuilder()
            .setColor(status.isAlive ? config.theme.colors.warning : config.theme.colors.success)
            .setTitle(boss.boss_name)
            .setDescription(`A powerful ${boss.boss_type} has appeared`)
            .addFields(
                {
                    name: 'Health',
                    value: `${boss.health.toLocaleString()} / ${boss.max_health.toLocaleString()} (${status.healthPercent}%)`,
                    inline: true
                },
                {
                    name: 'Time Remaining',
                    value: `${status.minutesRemaining} minutes`,
                    inline: true
                },
                {
                    name: 'Status',
                    value: status.isAlive ? 'Active' : 'Defeated',
                    inline: true
                },
                {
                    name: 'Rewards',
                    value: `${boss.reward_currency} currency, ${boss.reward_gems} gems\n(Top damage dealer gets 50% bonus)`,
                    inline: false
                }
            );

        if (topDamagers.length > 0) {
            const damageList = topDamagers.map((p, i) => `${i + 1}. ${p.username} - ${p.damage_dealt.toLocaleString()} damage`).join('\n');
            embed.addFields({
                name: 'Top Damage Dealers',
                value: damageList
            });
        }

        embed.setFooter({ text: 'Use /attack to join the fight' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
