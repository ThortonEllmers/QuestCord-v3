// Migration: add-leveling-system

module.exports = {
    up: (db) => {
        db.exec(`
            ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
            ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0;
            ALTER TABLE users ADD COLUMN total_experience INTEGER DEFAULT 0;
        `);
    },

    down: (db) => {
        // SQLite doesn't support DROP COLUMN easily, would need table recreation
        db.exec(`
            CREATE TABLE users_backup AS SELECT
                id, discord_id, username, currency, gems, total_quests,
                current_server_id, created_at, updated_at
            FROM users;

            DROP TABLE users;

            ALTER TABLE users_backup RENAME TO users;
        `);
    }
};
