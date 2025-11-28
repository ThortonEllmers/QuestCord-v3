const { BossModel, ServerModel, GlobalStatsModel } = require('../../database/models');
const { getRandomBoss } = require('./questData');
const config = require('../../../config.json');

class BossManager {
    static bossSpawnTimer = null;

    static initialize(client) {
        this.client = client;
        this.scheduleNextBoss();
        console.log('Boss spawning system initialized');
    }

    static scheduleNextBoss() {
        BossModel.cleanupExpired();

        const activeBoss = BossModel.getActiveBoss();
        if (activeBoss) {
            const timeRemaining = (activeBoss.expires_at * 1000) - Date.now();
            if (timeRemaining > 0) {
                setTimeout(() => this.scheduleNextBoss(), timeRemaining + config.boss.cooldownDuration);
                console.log(`Active boss found. Next check in ${Math.round(timeRemaining / 60000)} minutes`);
                return;
            }
        }

        const stats = GlobalStatsModel.get();
        const now = Math.floor(Date.now() / 1000);
        const timeSinceLastBoss = now - (stats.last_boss_spawn || 0);

        if (timeSinceLastBoss < (config.boss.cooldownDuration / 1000)) {
            const waitTime = (config.boss.cooldownDuration / 1000) - timeSinceLastBoss;
            setTimeout(() => this.scheduleNextBoss(), waitTime * 1000);
            console.log(`Boss cooldown active. Next spawn check in ${Math.round(waitTime / 60)} minutes`);
            return;
        }

        const delay = Math.random() * (config.boss.maxSpawnDelay - config.boss.minSpawnDelay) + config.boss.minSpawnDelay;

        this.bossSpawnTimer = setTimeout(() => {
            this.spawnBoss();
        }, delay);

        console.log(`Next boss will spawn in approximately ${Math.round(delay / 60000)} minutes`);
    }

    static spawnBoss() {
        try {
            const servers = ServerModel.getOptedInServers();
            if (servers.length === 0) {
                console.log('No opted-in servers available for boss spawn');
                this.scheduleNextBoss();
                return;
            }

            const randomServer = servers[Math.floor(Math.random() * servers.length)];
            const bossTemplate = getRandomBoss();

            const expiresAt = Math.floor(Date.now() / 1000) + (config.boss.spawnDuration / 1000);

            const result = BossModel.create(
                bossTemplate.type,
                bossTemplate.name,
                randomServer.discord_id,
                bossTemplate.health,
                bossTemplate.rewardCurrency,
                bossTemplate.rewardGems,
                expiresAt
            );

            const now = Math.floor(Date.now() / 1000);
            GlobalStatsModel.updateLastBossSpawn(now);

            console.log(`Boss spawned: ${bossTemplate.name} in server ${randomServer.name}`);

            this.announceBossSpawn(randomServer.discord_id, bossTemplate.name, result.lastInsertRowid);

            setTimeout(() => this.scheduleNextBoss(), config.boss.spawnDuration + config.boss.cooldownDuration);
        } catch (error) {
            console.error('Error spawning boss:', error);
            this.scheduleNextBoss();
        }
    }

    static async announceBossSpawn(serverId, bossName, bossId) {
        try {
            const guild = this.client.guilds.cache.get(serverId);
            if (!guild) return;

            const channel = guild.channels.cache.find(ch =>
                ch.name.includes('general') ||
                ch.name.includes('quest') ||
                ch.name.includes('announcements')
            );

            if (channel && channel.isTextBased()) {
                await channel.send({
                    content: `**A wild boss has appeared!**\n\n**${bossName}** has spawned in this server!\nUse \`/attack\` to join the fight!\n\nBoss will despawn in 60 minutes if not defeated.`
                });
            }
        } catch (error) {
            console.error('Error announcing boss spawn:', error);
        }
    }

    static getBossStatus(boss) {
        const healthPercent = Math.round((boss.health / boss.max_health) * 100);
        const timeRemaining = boss.expires_at - Math.floor(Date.now() / 1000);
        const minutesRemaining = Math.max(0, Math.round(timeRemaining / 60));

        return {
            healthPercent,
            minutesRemaining,
            isAlive: boss.health > 0 && !boss.defeated
        };
    }
}

module.exports = { BossManager };
