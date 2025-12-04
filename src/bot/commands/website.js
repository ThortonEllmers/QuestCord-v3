const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { WebsiteSettingsModel } = require('../../database/models');
const { isStaff } = require('../utils/permissions');
const config = require('../../../config.json');
const { debugLogger } = require('../../utils/debugLogger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('website')
        .setDescription('Manage website settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('help')
                .setDescription('View website settings help')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('View current website feature status')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('feature')
                .setDescription('Toggle a website feature (Staff only)')
                .addStringOption(option =>
                    option
                        .setName('name')
                        .setDescription('Feature name')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Card Hover Effects', value: 'card_hover_effects' },
                            { name: 'Background Animations', value: 'background_animations' },
                            { name: 'Cosmic Particles', value: 'cosmic_particles' },
                            { name: 'Aurora Effect', value: 'aurora_effect' },
                            { name: 'Gradient Animations', value: 'gradient_animations' },
                            { name: 'Party Mode', value: 'party_mode' },
                            { name: 'Insult Display', value: 'insult_display' },
                            { name: 'Chaos Mode', value: 'chaos_mode' },
                            { name: 'Performance Mode', value: 'performance_mode' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('state')
                        .setDescription('Enable or disable')
                        .setRequired(true)
                        .addChoices(
                            { name: 'On', value: 'on' },
                            { name: 'Off', value: 'off' }
                        )
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'help') {
            return handleHelp(interaction);
        } else if (subcommand === 'status') {
            return handleStatus(interaction);
        } else if (subcommand === 'feature') {
            return handleFeature(interaction);
        }
    }
};

async function handleHelp(interaction) {
    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.primary)
        .setTitle('🌐 Website Settings Help')
        .setDescription('Manage visual effects and features on the QuestCord website')
        .addFields(
            {
                name: 'Commands',
                value: '`/website status` - View current feature status\n`/website feature <name> <on/off>` - Toggle a feature (Staff only)',
                inline: false
            },
            {
                name: 'Available Features',
                value: '**Visual Effects:**\n• Card Hover Effects\n• Background Animations\n• Cosmic Particles\n• Aurora Effect\n• Gradient Animations\n\n**Interactive Features:**\n• Party Mode\n• Insult Display\n• Chaos Mode\n\n**Performance:**\n• Performance Mode (disables all effects)',
                inline: false
            }
        )
        .setFooter({ text: 'Visit https://questcord.fun to see the website' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleStatus(interaction) {
    const settings = WebsiteSettingsModel.get();

    if (!settings) {
        return interaction.reply({
            content: '❌ Unable to fetch website settings.',
            ephemeral: true
        });
    }

    const formatStatus = (value) => value ? '🟢 Enabled' : '🔴 Disabled';

    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.primary)
        .setTitle('🌐 Website Feature Status')
        .setDescription('Current status of all website features')
        .addFields(
            {
                name: '🎨 Visual Effects',
                value: `Card Hover Effects: ${formatStatus(settings.card_hover_effects)}\nBackground Animations: ${formatStatus(settings.background_animations)}\nCosmic Particles: ${formatStatus(settings.cosmic_particles)}\nAurora Effect: ${formatStatus(settings.aurora_effect)}\nGradient Animations: ${formatStatus(settings.gradient_animations)}`,
                inline: false
            },
            {
                name: '✨ Interactive Features',
                value: `Party Mode: ${formatStatus(settings.party_mode)}\nInsult Display: ${formatStatus(settings.insult_display)}\nChaos Mode: ${formatStatus(settings.chaos_mode)}`,
                inline: false
            },
            {
                name: '⚡ Performance',
                value: `Performance Mode: ${formatStatus(settings.performance_mode)}`,
                inline: false
            }
        )
        .setFooter({ text: 'Use /website feature to toggle settings' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleFeature(interaction) {
    // Check if user is staff
    if (!await isStaff(interaction)) {
        return interaction.reply({
            content: '❌ This command is only available to QuestCord staff.',
            ephemeral: true
        });
    }

    const featureName = interaction.options.getString('name');
    const state = interaction.options.getString('state');
    const enabled = state === 'on' ? 1 : 0;

    try {
        const settings = {};
        settings[featureName] = enabled;
        WebsiteSettingsModel.update(settings);

        // Broadcast updated settings to all connected clients
        const { broadcastWebsiteSettings } = require('../../web/server');
        const updatedSettings = WebsiteSettingsModel.get();
        broadcastWebsiteSettings({
            effects: {
                backgroundAnimations: updatedSettings.background_animations === 1,
                cardHoverEffects: updatedSettings.card_hover_effects === 1,
                cosmicParticles: updatedSettings.cosmic_particles === 1,
                auroraEffect: updatedSettings.aurora_effect === 1,
                gradientAnimations: updatedSettings.gradient_animations === 1
            },
            interactiveFeatures: {
                partyMode: updatedSettings.party_mode === 1,
                insultDisplay: updatedSettings.insult_display === 1,
                chaosMode: updatedSettings.chaos_mode === 1
            },
            performanceMode: updatedSettings.performance_mode === 1
        });

        const prettyName = featureName.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');

        const embed = new EmbedBuilder()
            .setColor(state === 'on' ? config.theme.colors.success : config.theme.colors.warning)
            .setTitle('✅ Feature Updated')
            .setDescription(`**${prettyName}** has been ${state === 'on' ? 'enabled' : 'disabled'} on the website.`)
            .addFields({
                name: 'Updated by',
                value: `${interaction.user.username} (${interaction.user.id})`,
                inline: true
            })
            .setFooter({ text: 'Changes will be reflected on all connected browsers instantly' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        await debugLogger.success('WEBSITE', `Feature ${prettyName} ${state === 'on' ? 'enabled' : 'disabled'}`, {
            feature: featureName,
            state: state,
            user: interaction.user.username,
            userId: interaction.user.id
        });

        console.log(`[WEBSITE] ${prettyName} ${state === 'on' ? 'enabled' : 'disabled'} by ${interaction.user.username} (${interaction.user.id})`);
    } catch (error) {
        console.error('Error updating website feature:', error);
        await interaction.reply({
            content: '❌ An error occurred while updating the feature.',
            ephemeral: true
        });
    }
}
