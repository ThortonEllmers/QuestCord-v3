const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

// Function to recursively read command files from directories
function loadCommands(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const itemPath = path.join(dir, item.name);

        if (item.isDirectory()) {
            // Recursively load commands from subdirectories
            loadCommands(itemPath);
        } else if (item.isFile() && item.name.endsWith('.js')) {
            // Load command file
            const command = require(itemPath);
            if ('data' in command && 'execute' in command) {
                commands.push(command.data.toJSON());
            }
        }
    }
}

// Load all commands
loadCommands(commandsPath);

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // Deploy to guild for instant updates (use applicationCommands for global)
        const guildId = '1404523107544469545';
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        // Log to debug channel if available
        try {
            const { Client, GatewayIntentBits } = require('discord.js');
            const { debugLogger } = require('../utils/debugLogger');
            const { db } = require('../database/schema');

            const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
            await tempClient.login(process.env.DISCORD_TOKEN);

            // Initialize debug logger
            await debugLogger.initialize(tempClient);

            // Get disabled and restricted commands
            const disabledCommands = db.prepare('SELECT command_name FROM disabled_commands').all();
            const restrictedCommands = db.prepare('SELECT DISTINCT command_name FROM command_whitelist').all();

            const commandList = commands.map(cmd => cmd.name);
            const disabledList = disabledCommands.map(c => c.command_name);
            const restrictedList = restrictedCommands.map(c => c.command_name);

            await debugLogger.success('COMMANDS', `Deployed ${data.length} commands to guild`, {
                guildId: guildId,
                totalCommands: data.length,
                commands: commandList.join(', '),
                disabledCommands: disabledList.length > 0 ? disabledList.join(', ') : 'None',
                restrictedCommands: restrictedList.length > 0 ? restrictedList.join(', ') : 'None'
            });

            await tempClient.destroy();
        } catch (debugError) {
            console.error('Failed to log to debug channel:', debugError.message);
        }
    } catch (error) {
        console.error(error);
    }
})();
