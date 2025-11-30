const { BossModel, ServerModel, GlobalStatsModel } = require('../../database/models');
const { getRandomBoss } = require('./questData');
const { EmbedBuilder } = require('discord.js');
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

            this.announceBossSpawn(randomServer, bossTemplate, result.lastInsertRowid);

            setTimeout(() => this.scheduleNextBoss(), config.boss.spawnDuration + config.boss.cooldownDuration);
        } catch (error) {
            console.error('Error spawning boss:', error);
            this.scheduleNextBoss();
        }
    }

    static async announceBossSpawn(server, bossTemplate, bossId) {
        try {
            // Specific announcement channel
            const ANNOUNCEMENT_CHANNEL_ID = '1411045103921004554';
            const BOSS_ROLE_ID = '1411051374153826386';

            const announcementChannel = this.client.channels.cache.get(ANNOUNCEMENT_CHANNEL_ID);
            if (!announcementChannel) {
                console.error('Boss announcement channel not found');
                return;
            }

            const guild = this.client.guilds.cache.get(server.discord_id);
            if (!guild) return;

            // Get server icon
            const serverIcon = guild.iconURL({ size: 256, extension: 'png' }) || 'https://cdn.discordapp.com/embed/avatars/0.png';

            // Calculate time remaining (60 minutes)
            const minutesRemaining = Math.floor(config.boss.spawnDuration / 60000);

            // Create embed
            const embed = new EmbedBuilder()
                .setColor('#FF6B35')
                .setTitle(`🔥 NEW BOSS ALERT 🔥`)
                .setDescription(`⚔️ **${bossTemplate.name} has spawned!**\nA Tier ${bossTemplate.tier} ${bossTemplate.rarity} boss has emerged and threatens the realm!`)
                .addFields(
                    {
                        name: '💀 Boss Info',
                        value: `**HP:** ${bossTemplate.health.toLocaleString()}\n**Type:** ${bossTemplate.rarity} (Tier ${bossTemplate.tier})\n**Biome:** ${bossTemplate.biome}`,
                        inline: false
                    },
                    {
                        name: '📍 Location',
                        value: `**${server.name}**`,
                        inline: true
                    },
                    {
                        name: '🌐 Visit Website',
                        value: '[questcord.fun](https://questcord.fun)',
                        inline: true
                    },
                    {
                        name: '⏰ Time Left',
                        value: `${minutesRemaining}m`,
                        inline: true
                    },
                    {
                        name: '⚔️ How to Fight',
                        value: `• Join the server where the boss spawned\n• Use \`/boss attack\` to deal damage\n• Work together with other players!\n• Defeat it for valuable rewards`,
                        inline: false
                    },
                    {
                        name: '🚀 How to Travel',
                        value: `Use \`/travel\` command in any QuestCord server to see available destinations and travel to **${server.name}**!`,
                        inline: false
                    }
                )
                .setThumbnail(serverIcon)
                .setFooter({ text: `Boss spawned on server • ${server.name}` })
                .setTimestamp();

            // Send announcement with role ping
            await announcementChannel.send({
                content: `<@&${BOSS_ROLE_ID}>`,
                embeds: [embed]
            });

            console.log(`Boss announcement sent to channel ${ANNOUNCEMENT_CHANNEL_ID}`);
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
