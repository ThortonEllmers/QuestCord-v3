const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { UserModel, UserQuestModel, BossParticipantModel, LeaderboardModel, UserItemModel } = require('../../database/models');
const { isStaff, isDeveloper } = require('../utils/permissions');
const { LevelSystem } = require('../../utils/levelSystem');
const config = require('../../../config.json');
const { db } = require('../../database/schema');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Staff commands for data management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('wipe-user')
                .setDescription('Completely delete a user\'s data (irreversible)')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to wipe')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-user')
                .setDescription('Reset user progress but keep their account')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to reset')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('give-currency')
                .setDescription('Give currency to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give currency to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of currency to give')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('give-gems')
                .setDescription('Give gems to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give gems to')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('amount')
                        .setDescription('Amount of gems to give')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('set-level')
                .setDescription('Set a user\'s level')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to modify')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('level')
                        .setDescription('Level to set')
                        .setRequired(true)
                        .setMinValue(1)
                        .setMaxValue(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view-user')
                .setDescription('View detailed user information')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to view')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-leaderboard')
                .setDescription('Reset a user\'s leaderboard points for current month')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to reset leaderboard points for')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-quests-global')
                .setDescription('Reset all quests for everyone (Developer only)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-quests-server')
                .setDescription('Reset quests for a specific server')
                .addStringOption(option =>
                    option.setName('server-id')
                        .setDescription('The server ID to reset quests for')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset-quests-user')
                .setDescription('Reset quests for a specific user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to reset quests for')
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!await isStaff(interaction)) {
            return interaction.reply({
                content: 'This command is only available to QuestCord staff.',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');

        let user = targetUser ? UserModel.findByDiscordId(targetUser.id) : null;

        switch (subcommand) {
            case 'wipe-user':
                await handleWipeUser(interaction, targetUser, user);
                break;
            case 'reset-user':
                await handleResetUser(interaction, targetUser, user);
                break;
            case 'give-currency':
                await handleGiveCurrency(interaction, targetUser, user);
                break;
            case 'give-gems':
                await handleGiveGems(interaction, targetUser, user);
                break;
            case 'set-level':
                await handleSetLevel(interaction, targetUser, user);
                break;
            case 'view-user':
                await handleViewUser(interaction, targetUser, user);
                break;
            case 'reset-leaderboard':
                await handleResetLeaderboard(interaction, targetUser, user);
                break;
            case 'reset-quests-global':
                await handleResetQuestsGlobal(interaction);
                break;
            case 'reset-quests-server':
                await handleResetQuestsServer(interaction);
                break;
            case 'reset-quests-user':
                await handleResetQuestsUser(interaction, targetUser, user);
                break;
        }
    }
};

async function handleWipeUser(interaction, targetUser, user) {
    if (!user) {
        return interaction.reply({
            content: 'This user has no data in the system.',
            ephemeral: true
        });
    }

    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: 'Only developers can wipe user data.',
            ephemeral: true
        });
    }

    try {
        db.prepare('DELETE FROM users WHERE discord_id = ?').run(targetUser.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.error)
            .setTitle('User Data Wiped')
            .setDescription(`All data for ${targetUser.username} (${targetUser.id}) has been permanently deleted.`)
            .addFields({
                name: 'Staff Member',
                value: `${interaction.user.username} (${interaction.user.id})`
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] User data wiped: ${targetUser.username} (${targetUser.id}) by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error wiping user:', error);
        await interaction.reply({
            content: 'An error occurred while wiping user data.',
            ephemeral: true
        });
    }
}

async function handleResetUser(interaction, targetUser, user) {
    if (!user) {
        return interaction.reply({
            content: 'This user has no data in the system.',
            ephemeral: true
        });
    }

    try {
        db.prepare(`
            UPDATE users
            SET currency = ?, gems = ?, total_quests = 0, level = 1, experience = 0, total_experience = 0
            WHERE discord_id = ?
        `).run(config.economy.defaultCurrency, config.economy.defaultGems, targetUser.id);

        db.prepare('DELETE FROM user_quests WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM boss_participants WHERE user_id = ?').run(user.id);
        db.prepare('DELETE FROM user_items WHERE user_id = ?').run(user.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('User Progress Reset')
            .setDescription(`Progress for ${targetUser.username} has been reset to default values.`)
            .addFields(
                {
                    name: 'Reset Values',
                    value: `Level: 1\nDakari: ${config.economy.defaultCurrency}\nGems: ${config.economy.defaultGems}\nQuests: 0`
                },
                {
                    name: 'Staff Member',
                    value: `${interaction.user.username} (${interaction.user.id})`
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] User reset: ${targetUser.username} (${targetUser.id}) by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error resetting user:', error);
        await interaction.reply({
            content: 'An error occurred while resetting user data.',
            ephemeral: true
        });
    }
}

async function handleGiveCurrency(interaction, targetUser, user) {
    const amount = interaction.options.getInteger('amount');

    if (!user) {
        UserModel.create(targetUser.id, targetUser.username);
        user = UserModel.findByDiscordId(targetUser.id);
    }

    UserModel.updateCurrency(targetUser.id, amount);
    const updatedUser = UserModel.findByDiscordId(targetUser.id);

    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.success)
        .setTitle('Dakari Given')
        .setDescription(`${amount.toLocaleString()} Dakari has been given to ${targetUser.username}`)
        .addFields(
            {
                name: 'New Balance',
                value: updatedUser.currency.toLocaleString(),
                inline: true
            },
            {
                name: 'Staff Member',
                value: interaction.user.username
            }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`[ADMIN] Currency given: ${amount} to ${targetUser.username} by ${interaction.user.username}`);
}

async function handleGiveGems(interaction, targetUser, user) {
    const amount = interaction.options.getInteger('amount');

    if (!user) {
        UserModel.create(targetUser.id, targetUser.username);
        user = UserModel.findByDiscordId(targetUser.id);
    }

    UserModel.updateGems(targetUser.id, amount);
    const updatedUser = UserModel.findByDiscordId(targetUser.id);

    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.success)
        .setTitle('Gems Given')
        .setDescription(`${amount.toLocaleString()} gems have been given to ${targetUser.username}`)
        .addFields(
            {
                name: 'New Balance',
                value: updatedUser.gems.toLocaleString(),
                inline: true
            },
            {
                name: 'Staff Member',
                value: interaction.user.username
            }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`[ADMIN] Gems given: ${amount} to ${targetUser.username} by ${interaction.user.username}`);
}

async function handleSetLevel(interaction, targetUser, user) {
    const level = interaction.options.getInteger('level');

    if (!user) {
        UserModel.create(targetUser.id, targetUser.username);
        user = UserModel.findByDiscordId(targetUser.id);
    }

    let totalExp = 0;
    for (let i = 1; i < level; i++) {
        totalExp += LevelSystem.getRequiredExperience(i);
    }

    UserModel.updateLevel(targetUser.id, level, 0, totalExp);

    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.primary)
        .setTitle('Level Set')
        .setDescription(`${targetUser.username}'s level has been set to ${level}`)
        .addFields(
            {
                name: 'Level Title',
                value: LevelSystem.getLevelTitle(level)
            },
            {
                name: 'Staff Member',
                value: interaction.user.username
            }
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    console.log(`[ADMIN] Level set: ${level} for ${targetUser.username} by ${interaction.user.username}`);
}

async function handleViewUser(interaction, targetUser, user) {
    if (!user) {
        return interaction.reply({
            content: 'This user has no data in the system.',
            ephemeral: true
        });
    }

    const now = new Date();
    const rank = LeaderboardModel.getUserRank(user.id, now.getMonth() + 1, now.getFullYear());
    const progressBar = LevelSystem.getProgressBar(user.experience, LevelSystem.getRequiredExperience(user.level));

    const embed = new EmbedBuilder()
        .setColor(config.theme.colors.primary)
        .setTitle(`Admin View: ${targetUser.username}`)
        .setDescription(`**${LevelSystem.getLevelTitle(user.level)}**`)
        .addFields(
            {
                name: 'User ID',
                value: user.discord_id,
                inline: true
            },
            {
                name: 'Database ID',
                value: user.id.toString(),
                inline: true
            },
            {
                name: 'Level',
                value: `${user.level}\n${progressBar} ${user.experience}/${LevelSystem.getRequiredExperience(user.level)} XP`,
                inline: false
            },
            {
                name: 'Dakari',
                value: user.currency.toLocaleString(),
                inline: true
            },
            {
                name: 'Gems',
                value: user.gems.toLocaleString(),
                inline: true
            },
            {
                name: 'Total Quests',
                value: user.total_quests.toLocaleString(),
                inline: true
            },
            {
                name: 'Total Experience',
                value: user.total_experience.toLocaleString(),
                inline: true
            },
            {
                name: 'Leaderboard Rank',
                value: rank ? `#${rank}` : 'Unranked',
                inline: true
            },
            {
                name: 'Account Created',
                value: `<t:${user.created_at}:F>`,
                inline: false
            },
            {
                name: 'Last Updated',
                value: `<t:${user.updated_at}:R>`,
                inline: false
            }
        )
        .setFooter({ text: `Requested by ${interaction.user.username}` })
        .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleResetLeaderboard(interaction, targetUser, user) {
    if (!user) {
        return interaction.reply({
            content: 'This user has no data in the system.',
            ephemeral: true
        });
    }

    try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Delete leaderboard entry for current month
        db.prepare('DELETE FROM leaderboard WHERE user_id = ? AND month = ? AND year = ?')
            .run(user.id, month, year);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('Leaderboard Points Reset')
            .setDescription(`Leaderboard points for ${targetUser.username} have been reset for ${now.toLocaleString('default', { month: 'long' })} ${year}`)
            .addFields(
                {
                    name: 'Staff Member',
                    value: `${interaction.user.username} (${interaction.user.id})`
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        // Broadcast updated leaderboard
        const { broadcastLeaderboard } = require('../../web/server');
        const topPlayers = LeaderboardModel.getTopPlayers(month, year, 10);
        broadcastLeaderboard(topPlayers);

        console.log(`[ADMIN] Leaderboard reset for ${targetUser.username} by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error resetting leaderboard:', error);
        await interaction.reply({
            content: 'An error occurred while resetting leaderboard points.',
            ephemeral: true
        });
    }
}

async function handleResetQuestsGlobal(interaction) {
    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: 'Only developers can reset quests globally.',
            ephemeral: true
        });
    }

    try {
        // Delete all user quest entries
        const result = db.prepare('DELETE FROM user_quests').run();

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('🔄 Global Quest Reset')
            .setDescription(`All quests have been reset for everyone.`)
            .addFields(
                {
                    name: 'Quests Deleted',
                    value: result.changes.toLocaleString()
                },
                {
                    name: 'Staff Member',
                    value: `${interaction.user.username} (${interaction.user.id})`
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] Global quest reset by ${interaction.user.username} - ${result.changes} quests deleted`);
    } catch (error) {
        console.error('Error resetting quests globally:', error);
        await interaction.reply({
            content: 'An error occurred while resetting quests globally.',
            ephemeral: true
        });
    }
}

async function handleResetQuestsServer(interaction) {
    const serverId = interaction.options.getString('server-id');

    try {
        // Get all quests for this server
        const quests = db.prepare('SELECT id FROM quests WHERE server_id = ?').all(serverId);

        if (quests.length === 0) {
            return interaction.reply({
                content: 'No quests found for this server.',
                ephemeral: true
            });
        }

        const questIds = quests.map(q => q.id);

        // Delete user quest entries for this server's quests
        const placeholders = questIds.map(() => '?').join(',');
        const result = db.prepare(`DELETE FROM user_quests WHERE quest_id IN (${placeholders})`).run(...questIds);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('🔄 Server Quest Reset')
            .setDescription(`All quests have been reset for server \`${serverId}\`.`)
            .addFields(
                {
                    name: 'Quest Entries Deleted',
                    value: result.changes.toLocaleString()
                },
                {
                    name: 'Staff Member',
                    value: `${interaction.user.username} (${interaction.user.id})`
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] Server quest reset for ${serverId} by ${interaction.user.username} - ${result.changes} entries deleted`);
    } catch (error) {
        console.error('Error resetting server quests:', error);
        await interaction.reply({
            content: 'An error occurred while resetting server quests.',
            ephemeral: true
        });
    }
}

async function handleResetQuestsUser(interaction, targetUser, user) {
    if (!user) {
        return interaction.reply({
            content: 'This user has no data in the system.',
            ephemeral: true
        });
    }

    try {
        // Delete all quest entries for this user
        const result = db.prepare('DELETE FROM user_quests WHERE user_id = ?').run(user.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('🔄 User Quest Reset')
            .setDescription(`All quests have been reset for ${targetUser.username}.`)
            .addFields(
                {
                    name: 'Quest Entries Deleted',
                    value: result.changes.toLocaleString()
                },
                {
                    name: 'Staff Member',
                    value: `${interaction.user.username} (${interaction.user.id})`
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] User quest reset for ${targetUser.username} by ${interaction.user.username} - ${result.changes} entries deleted`);
    } catch (error) {
        console.error('Error resetting user quests:', error);
        await interaction.reply({
            content: 'An error occurred while resetting user quests.',
            ephemeral: true
        });
    }
}
