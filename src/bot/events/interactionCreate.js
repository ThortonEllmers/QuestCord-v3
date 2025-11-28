const { UserModel, ActivityLogModel } = require('../../database/models');
const { broadcastActivity } = require('../../web/server');
const { getReportingInstance } = require('../../utils/reportingSystem');
const { handleQuestAccept, handleCombatAttack, handleExplorationContinue } = require('../utils/questInteractions');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions for quests
        if (interaction.isButton()) {
            try {
                if (interaction.customId.startsWith('accept_quest_')) {
                    return await handleQuestAccept(interaction);
                }
                if (interaction.customId.startsWith('combat_attack_')) {
                    return await handleCombatAttack(interaction);
                }
                if (interaction.customId.startsWith('explore_continue_')) {
                    return await handleExplorationContinue(interaction);
                }
                // Help menu buttons
                if (interaction.customId === 'help_tutorial') {
                    const tutorialCommand = interaction.client.commands.get('tutorial');
                    if (tutorialCommand) {
                        return await tutorialCommand.execute(interaction);
                    }
                }
                if (interaction.customId === 'help_quests') {
                    const questsCommand = interaction.client.commands.get('quests');
                    if (questsCommand) {
                        return await questsCommand.execute(interaction);
                    }
                }
                if (interaction.customId === 'help_profile') {
                    const profileCommand = interaction.client.commands.get('profile');
                    if (profileCommand) {
                        return await profileCommand.execute(interaction);
                    }
                }
            } catch (error) {
                console.error('Error handling button interaction:', error);
                const reporting = getReportingInstance();
                if (reporting) {
                    reporting.sendErrorReport(error, `Button interaction: ${interaction.customId}`);
                }

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'An error occurred while processing your action.',
                        ephemeral: true
                    });
                }
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        try {
            let user = UserModel.findByDiscordId(interaction.user.id);
            if (!user) {
                UserModel.create(interaction.user.id, interaction.user.username);
                user = UserModel.findByDiscordId(interaction.user.id);
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const action = `Used command: /${interaction.commandName}`;

            ActivityLogModel.log(
                user.id,
                interaction.user.username,
                action,
                JSON.stringify({ guild: interaction.guild?.name || 'DM' })
            );

            broadcastActivity({
                user_id: user.id,
                username: interaction.user.username,
                action: action,
                timestamp: timestamp
            });

            // Track command execution
            const reporting = getReportingInstance();
            if (reporting) {
                reporting.incrementCommands();
            }

            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing command ${interaction.commandName}:`, error);

            // Report error to Discord channel
            const reporting = getReportingInstance();
            if (reporting) {
                reporting.sendErrorReport(error, `Command: /${interaction.commandName} by ${interaction.user.tag}`);
            }

            const errorMessage = {
                content: 'An error occurred while executing this command.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    }
};
