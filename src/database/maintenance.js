const { DatabaseUtils } = require('./utils');
const cron = require('node-cron');

class DatabaseMaintenance {
    static start() {
        cron.schedule('0 3 * * *', () => {
            console.log('Running daily database maintenance...');

            if (DatabaseUtils.checkIntegrity()) {
                console.log('Database integrity check passed');
            } else {
                console.error('Database integrity check FAILED! Manual intervention required.');
            }

            DatabaseUtils.createBackup();
            DatabaseUtils.optimize();

            console.log('Database maintenance completed');
        });

        cron.schedule('0 */6 * * *', () => {
            console.log('Running periodic database optimization...');
            DatabaseUtils.optimize();
        });

        console.log('Database maintenance scheduler started');
    }

    static runManualMaintenance() {
        console.log('Running manual database maintenance...');

        const integrityOk = DatabaseUtils.checkIntegrity();
        const backupPath = DatabaseUtils.createBackup();
        const optimized = DatabaseUtils.optimize();
        DatabaseUtils.vacuum();

        return {
            integrityCheck: integrityOk,
            backup: backupPath,
            optimized: optimized,
            stats: DatabaseUtils.getStats()
        };
    }
}

module.exports = { DatabaseMaintenance };
