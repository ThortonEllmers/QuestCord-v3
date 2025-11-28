const { UserModel, ActivityLogModel } = require('../../database/models');
const { broadcastActivity } = require('../../web/server');
const { getReportingInstance } = require('../../utils/reportingSystem');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
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
