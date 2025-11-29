const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/questcord.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initializeDatabase() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            currency INTEGER DEFAULT 0,
            gems INTEGER DEFAULT 0,
            total_quests INTEGER DEFAULT 0,
            current_server_id TEXT,
            last_quest_time INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            experience INTEGER DEFAULT 0,
            total_experience INTEGER DEFAULT 0,
            pvp_enabled INTEGER DEFAULT 0,
            attack INTEGER DEFAULT 10,
            defense INTEGER DEFAULT 10,
            health INTEGER DEFAULT 100,
            max_health INTEGER DEFAULT 100,
            pvp_wins INTEGER DEFAULT 0,
            pvp_losses INTEGER DEFAULT 0,
            traveling INTEGER DEFAULT 0,
            travel_destination TEXT,
            travel_arrives_at INTEGER DEFAULT 0,
            last_travel_time INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);

        CREATE TABLE IF NOT EXISTS servers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            opted_in INTEGER DEFAULT 1,
            member_count INTEGER DEFAULT 0,
            total_quests_completed INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_servers_discord_id ON servers(discord_id);
        CREATE INDEX IF NOT EXISTS idx_servers_opted_in ON servers(opted_in);

        CREATE TABLE IF NOT EXISTS quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            server_id TEXT NOT NULL,
            quest_type TEXT NOT NULL,
            quest_name TEXT NOT NULL,
            description TEXT NOT NULL,
            reward_currency INTEGER NOT NULL,
            reward_gems INTEGER NOT NULL,
            difficulty TEXT NOT NULL,
            assigned_date TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_quests_server_id ON quests(server_id);
        CREATE INDEX IF NOT EXISTS idx_quests_assigned_date ON quests(assigned_date);
        CREATE INDEX IF NOT EXISTS idx_quests_expires_at ON quests(expires_at);

        CREATE TABLE IF NOT EXISTS user_quests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quest_id INTEGER NOT NULL,
            completed INTEGER DEFAULT 0,
            failed INTEGER DEFAULT 0,
            progress INTEGER DEFAULT 0,
            completed_at INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
            UNIQUE(user_id, quest_id)
        );

        CREATE INDEX IF NOT EXISTS idx_user_quests_user_id ON user_quests(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_quests_quest_id ON user_quests(quest_id);
        CREATE INDEX IF NOT EXISTS idx_user_quests_completed ON user_quests(completed);

        CREATE TABLE IF NOT EXISTS bosses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boss_type TEXT NOT NULL,
            boss_name TEXT NOT NULL,
            server_id TEXT NOT NULL,
            health INTEGER NOT NULL,
            max_health INTEGER NOT NULL,
            reward_currency INTEGER NOT NULL,
            reward_gems INTEGER NOT NULL,
            spawned_at INTEGER DEFAULT (strftime('%s', 'now')),
            expires_at INTEGER NOT NULL,
            defeated INTEGER DEFAULT 0,
            defeated_at INTEGER
        );

        CREATE INDEX IF NOT EXISTS idx_bosses_server_id ON bosses(server_id);
        CREATE INDEX IF NOT EXISTS idx_bosses_defeated ON bosses(defeated);
        CREATE INDEX IF NOT EXISTS idx_bosses_expires_at ON bosses(expires_at);

        CREATE TABLE IF NOT EXISTS boss_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boss_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            damage_dealt INTEGER DEFAULT 0,
            attacks INTEGER DEFAULT 0,
            joined_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (boss_id) REFERENCES bosses(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(boss_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_boss_participants_boss_id ON boss_participants(boss_id);
        CREATE INDEX IF NOT EXISTS idx_boss_participants_user_id ON boss_participants(user_id);

        CREATE TABLE IF NOT EXISTS leaderboard (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            score INTEGER DEFAULT 0,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            updated_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, month, year)
        );

        CREATE INDEX IF NOT EXISTS idx_leaderboard_month_year ON leaderboard(month, year);
        CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

        CREATE TABLE IF NOT EXISTS activity_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            username TEXT NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            timestamp INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_activity_log_timestamp ON activity_log(timestamp DESC);

        CREATE TABLE IF NOT EXISTS staff (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            discord_id TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            role TEXT NOT NULL,
            added_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_staff_discord_id ON staff(discord_id);

        CREATE TABLE IF NOT EXISTS global_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            total_servers INTEGER DEFAULT 0,
            total_users INTEGER DEFAULT 0,
            total_quests_completed INTEGER DEFAULT 0,
            last_boss_spawn INTEGER DEFAULT 0,
            updated_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        INSERT OR IGNORE INTO global_stats (id) VALUES (1);

        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            item_name TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            rarity TEXT NOT NULL,
            item_type TEXT NOT NULL,
            attack_power INTEGER DEFAULT 0,
            defense_power INTEGER DEFAULT 0,
            crit_chance INTEGER DEFAULT 0,
            currency_cost INTEGER DEFAULT 0,
            gem_cost INTEGER DEFAULT 0,
            created_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS user_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            equipped INTEGER DEFAULT 0,
            acquired_at INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
            UNIQUE(user_id, item_id)
        );

        CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);

        CREATE TABLE IF NOT EXISTS disabled_commands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command_name TEXT UNIQUE NOT NULL,
            disabled_by TEXT NOT NULL,
            disabled_at INTEGER DEFAULT (strftime('%s', 'now'))
        );

        CREATE TABLE IF NOT EXISTS command_whitelist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            command_name TEXT NOT NULL,
            discord_id TEXT NOT NULL,
            added_by TEXT NOT NULL,
            added_at INTEGER DEFAULT (strftime('%s', 'now')),
            UNIQUE(command_name, discord_id)
        );

        CREATE INDEX IF NOT EXISTS idx_command_whitelist_command ON command_whitelist(command_name);
        CREATE INDEX IF NOT EXISTS idx_command_whitelist_user ON command_whitelist(discord_id);
    `);

    // Migrations
    const userTableInfo = db.prepare("PRAGMA table_info(users)").all();
    const questTableInfo = db.prepare("PRAGMA table_info(user_quests)").all();
    const itemTableInfo = db.prepare("PRAGMA table_info(items)").all();
    const userItemTableInfo = db.prepare("PRAGMA table_info(user_items)").all();

    // Migration: Add missing columns to users table
    const hasLastQuestTime = userTableInfo.some(col => col.name === 'last_quest_time');
    const hasLevel = userTableInfo.some(col => col.name === 'level');
    const hasExperience = userTableInfo.some(col => col.name === 'experience');
    const hasTotalExperience = userTableInfo.some(col => col.name === 'total_experience');

    if (!hasLastQuestTime) {
        console.log('Running migration: Adding last_quest_time to users...');
        db.exec('ALTER TABLE users ADD COLUMN last_quest_time INTEGER DEFAULT 0');
        console.log('Migration completed: last_quest_time added');
    }

    if (!hasLevel) {
        console.log('Running migration: Adding level to users...');
        db.exec('ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1');
        console.log('Migration completed: level added');
    }

    if (!hasExperience) {
        console.log('Running migration: Adding experience to users...');
        db.exec('ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0');
        console.log('Migration completed: experience added');
    }

    if (!hasTotalExperience) {
        console.log('Running migration: Adding total_experience to users...');
        db.exec('ALTER TABLE users ADD COLUMN total_experience INTEGER DEFAULT 0');
        console.log('Migration completed: total_experience added');
    }

    // Migration: Add 'failed' column to user_quests if it doesn't exist
    const hasFailedColumn = questTableInfo.some(col => col.name === 'failed');

    if (!hasFailedColumn) {
        console.log('Running migration: Adding failed column to user_quests...');
        db.exec('ALTER TABLE user_quests ADD COLUMN failed INTEGER DEFAULT 0');
        console.log('Migration completed: failed column added');
    }

    // Migration: Update default currency from 100 to 0 for new users only
    const hasCurrency = userTableInfo.find(col => col.name === 'currency');
    if (hasCurrency && hasCurrency.dflt_value === '100') {
        console.log('Note: Default currency is now 0 for new users (existing users unaffected)');
    }

    // Migration: Add PVP columns to users table
    const pvpColumns = [
        { name: 'pvp_enabled', type: 'INTEGER DEFAULT 0' },
        { name: 'attack', type: 'INTEGER DEFAULT 10' },
        { name: 'defense', type: 'INTEGER DEFAULT 10' },
        { name: 'health', type: 'INTEGER DEFAULT 100' },
        { name: 'max_health', type: 'INTEGER DEFAULT 100' },
        { name: 'pvp_wins', type: 'INTEGER DEFAULT 0' },
        { name: 'pvp_losses', type: 'INTEGER DEFAULT 0' }
    ];

    // Migration: Add travel columns to users table
    const travelColumns = [
        { name: 'traveling', type: 'INTEGER DEFAULT 0' },
        { name: 'travel_destination', type: 'TEXT' },
        { name: 'travel_arrives_at', type: 'INTEGER DEFAULT 0' },
        { name: 'last_travel_time', type: 'INTEGER DEFAULT 0' }
    ];

    pvpColumns.forEach(column => {
        const hasColumn = userTableInfo.some(col => col.name === column.name);
        if (!hasColumn) {
            console.log(`Running migration: Adding ${column.name} to users...`);
            db.exec(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
            console.log(`Migration completed: ${column.name} added`);
        }
    });

    travelColumns.forEach(column => {
        const hasColumn = userTableInfo.some(col => col.name === column.name);
        if (!hasColumn) {
            console.log(`Running migration: Adding ${column.name} to users...`);
            db.exec(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
            console.log(`Migration completed: ${column.name} added`);
        }
    });

    // Migration: Add item stats columns
    const itemColumns = [
        { name: 'item_type', type: 'TEXT DEFAULT "misc"' },
        { name: 'attack_power', type: 'INTEGER DEFAULT 0' },
        { name: 'defense_power', type: 'INTEGER DEFAULT 0' },
        { name: 'crit_chance', type: 'INTEGER DEFAULT 0' }
    ];

    itemColumns.forEach(column => {
        const hasColumn = itemTableInfo.some(col => col.name === column.name);
        if (!hasColumn) {
            console.log(`Running migration: Adding ${column.name} to items...`);
            db.exec(`ALTER TABLE items ADD COLUMN ${column.name} ${column.type}`);
            console.log(`Migration completed: ${column.name} added`);
        }
    });

    // Migration: Add equipped column to user_items
    const hasEquipped = userItemTableInfo.some(col => col.name === 'equipped');
    if (!hasEquipped) {
        console.log('Running migration: Adding equipped to user_items...');
        db.exec('ALTER TABLE user_items ADD COLUMN equipped INTEGER DEFAULT 0');
        console.log('Migration completed: equipped added');
    }

    console.log('Database initialized successfully');

    // Seed items if this is first run
    const { seedItems } = require('./seedItems');
    seedItems();
}

module.exports = { db, initializeDatabase };
