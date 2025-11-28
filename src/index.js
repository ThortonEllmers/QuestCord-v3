require('dotenv').config();
const { BotClient } = require('./bot/index');
const { initializeDatabase } = require('./database/schema');
const { DatabaseMaintenance } = require('./database/maintenance');
const { MigrationManager } = require('./database/utils');
const { QuestManager } = require('./bot/utils/questManager');
const { BossManager } = require('./bot/utils/bossManager');
const { LeaderboardScheduler } = require('./utils/leaderboardScheduler');
const { startWebServer } = require('./web/server');

async function main() {
    try {
        console.log('Initializing QuestCord...');

        console.log('Setting up database...');
        initializeDatabase();

        const migrationManager = new MigrationManager();
        await migrationManager.runMigrations();

        DatabaseMaintenance.start();

        console.log('Starting Discord bot...');
        const client = new BotClient();

        await client.login(process.env.DISCORD_TOKEN);

        QuestManager.initialize();
        BossManager.initialize(client);
        LeaderboardScheduler.initialize();

        console.log('Starting web server...');
        await startWebServer(client);

        console.log('QuestCord initialized successfully');
    } catch (error) {
        console.error('Failed to initialize QuestCord:', error);
        process.exit(1);
    }
}

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

main();
