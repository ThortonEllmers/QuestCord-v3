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
        .addSubcommand(subcommand =>
            subcommand
                .setName('give-item')
                .setDescription('Give an item/weapon to a user')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to give the item to')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('item-name')
                        .setDescription('The name of the item to give')
                        .setRequired(true)
                )
                .addIntegerOption(option =>
                    option.setName('quantity')
                        .setDescription('Quantity to give (default: 1)')
                        .setRequired(false)
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable-command')
                .setDescription('Disable a command globally (Developer only)')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('The command name to disable')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('enable-command')
                .setDescription('Enable a disabled command (Developer only)')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('The command name to enable')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('restrict-command')
                .setDescription('Restrict a command to specific users only (Developer only)')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('The command name to restrict')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to allow access')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unrestrict-command')
                .setDescription('Remove restriction from a command (Developer only)')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('The command name to unrestrict')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from whitelist (leave empty to remove all)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list-disabled')
                .setDescription('List all disabled commands')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list-restrictions')
                .setDescription('List all command restrictions')
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Show restrictions for specific command')
                        .setRequired(false)
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
            case 'give-item':
                await handleGiveItem(interaction, targetUser, user);
                break;
            case 'disable-command':
                await handleDisableCommand(interaction);
                break;
            case 'enable-command':
                await handleEnableCommand(interaction);
                break;
            case 'restrict-command':
                await handleRestrictCommand(interaction);
                break;
            case 'unrestrict-command':
                await handleUnrestrictCommand(interaction);
                break;
            case 'list-disabled':
                await handleListDisabled(interaction);
                break;
            case 'list-restrictions':
                await handleListRestrictions(interaction);
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

async function handleGiveItem(interaction, targetUser, user) {
    const itemName = interaction.options.getString('item-name');
    const quantity = interaction.options.getInteger('quantity') || 1;

    if (!user) {
        UserModel.create(targetUser.id, targetUser.username);
        user = UserModel.findByDiscordId(targetUser.id);
    }

    try {
        // Find the item by name (case insensitive)
        const item = db.prepare('SELECT * FROM items WHERE LOWER(item_name) = LOWER(?)').get(itemName);

        if (!item) {
            // Get all item names for suggestions
            const allItems = db.prepare('SELECT item_name FROM items').all();
            const itemList = allItems.map(i => i.item_name).join(', ');

            return interaction.reply({
                content: `Item "${itemName}" not found.\n\nAvailable items: ${itemList}`,
                ephemeral: true
            });
        }

        // Check if user already has this item
        const existingItem = db.prepare('SELECT * FROM user_items WHERE user_id = ? AND item_id = ?').get(user.id, item.id);

        if (existingItem) {
            // Update quantity
            db.prepare('UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?')
                .run(quantity, user.id, item.id);
        } else {
            // Insert new item
            db.prepare('INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)')
                .run(user.id, item.id, quantity);
        }

        const rarityEmoji = {
            'common': '⚪',
            'uncommon': '🟢',
            'rare': '🔵',
            'epic': '🟣',
            'legendary': '🟠',
            'mythic': '🔴'
        }[item.rarity] || '⚪';

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.success)
            .setTitle('🎁 Item Given')
            .setDescription(`**${quantity}x ${item.item_name}** has been given to ${targetUser.username}`)
            .addFields(
                {
                    name: 'Item Details',
                    value: `${rarityEmoji} **${item.rarity.toUpperCase()}** ${item.item_type}\n${item.description}`,
                    inline: false
                },
                {
                    name: 'Stats',
                    value: `⚔️ Attack: ${item.attack_power}\n🛡️ Defense: ${item.defense_power}\n✨ Crit: ${item.crit_chance}%`,
                    inline: true
                },
                {
                    name: 'Staff Member',
                    value: interaction.user.username,
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });

        console.log(`[ADMIN] ${quantity}x ${item.item_name} given to ${targetUser.username} by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error giving item:', error);
        await interaction.reply({
            content: 'An error occurred while giving the item.',
            ephemeral: true
        });
    }
}

async function handleDisableCommand(interaction) {
    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: '❌ Only developers can disable commands.',
            ephemeral: true
        });
    }

    const commandName = interaction.options.getString('command');

    // Prevent disabling admin command
    if (commandName === 'admin') {
        return interaction.reply({
            content: '❌ Cannot disable the admin command!',
            ephemeral: true
        });
    }

    try {
        const existing = db.prepare('SELECT * FROM disabled_commands WHERE command_name = ?').get(commandName);

        if (existing) {
            return interaction.reply({
                content: `❌ Command **/${commandName}** is already disabled.`,
                ephemeral: true
            });
        }

        db.prepare('INSERT INTO disabled_commands (command_name, disabled_by) VALUES (?, ?)').run(commandName, interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('🚫 Command Disabled')
            .setDescription(`Command **/${commandName}** has been globally disabled.`)
            .addFields({
                name: 'Disabled By',
                value: interaction.user.username,
                inline: true
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        console.log(`[ADMIN] Command /${commandName} disabled by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error disabling command:', error);
        await interaction.reply({
            content: 'An error occurred while disabling the command.',
            ephemeral: true
        });
    }
}

async function handleEnableCommand(interaction) {
    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: '❌ Only developers can enable commands.',
            ephemeral: true
        });
    }

    const commandName = interaction.options.getString('command');

    try {
        const result = db.prepare('DELETE FROM disabled_commands WHERE command_name = ?').run(commandName);

        if (result.changes === 0) {
            return interaction.reply({
                content: `❌ Command **/${commandName}** is not disabled.`,
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.success)
            .setTitle('✅ Command Enabled')
            .setDescription(`Command **/${commandName}** has been enabled.`)
            .addFields({
                name: 'Enabled By',
                value: interaction.user.username,
                inline: true
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        console.log(`[ADMIN] Command /${commandName} enabled by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error enabling command:', error);
        await interaction.reply({
            content: 'An error occurred while enabling the command.',
            ephemeral: true
        });
    }
}

async function handleRestrictCommand(interaction) {
    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: '❌ Only developers can restrict commands.',
            ephemeral: true
        });
    }

    const commandName = interaction.options.getString('command');
    const targetUser = interaction.options.getUser('user');

    // Prevent restricting admin command
    if (commandName === 'admin') {
        return interaction.reply({
            content: '❌ Cannot restrict the admin command!',
            ephemeral: true
        });
    }

    try {
        const existing = db.prepare('SELECT * FROM command_whitelist WHERE command_name = ? AND discord_id = ?')
            .get(commandName, targetUser.id);

        if (existing) {
            return interaction.reply({
                content: `❌ User **${targetUser.username}** already has access to **/${commandName}**.`,
                ephemeral: true
            });
        }

        db.prepare('INSERT INTO command_whitelist (command_name, discord_id, added_by) VALUES (?, ?, ?)')
            .run(commandName, targetUser.id, interaction.user.id);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle('🔒 Command Restricted')
            .setDescription(`User **${targetUser.username}** has been added to the whitelist for **/${commandName}**.\n\n**Note:** Once a command has any whitelist entries, only whitelisted users (and staff) can use it.`)
            .addFields({
                name: 'Added By',
                value: interaction.user.username,
                inline: true
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
        console.log(`[ADMIN] User ${targetUser.username} whitelisted for /${commandName} by ${interaction.user.username}`);
    } catch (error) {
        console.error('Error restricting command:', error);
        await interaction.reply({
            content: 'An error occurred while restricting the command.',
            ephemeral: true
        });
    }
}

async function handleUnrestrictCommand(interaction) {
    if (!await isDeveloper(interaction)) {
        return interaction.reply({
            content: '❌ Only developers can unrestrict commands.',
            ephemeral: true
        });
    }

    const commandName = interaction.options.getString('command');
    const targetUser = interaction.options.getUser('user');

    try {
        let result;

        if (targetUser) {
            // Remove specific user from whitelist
            result = db.prepare('DELETE FROM command_whitelist WHERE command_name = ? AND discord_id = ?')
                .run(commandName, targetUser.id);

            if (result.changes === 0) {
                return interaction.reply({
                    content: `❌ User **${targetUser.username}** does not have whitelist access to **/${commandName}**.`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(config.theme.colors.success)
                .setTitle('🔓 User Removed from Whitelist')
                .setDescription(`User **${targetUser.username}** has been removed from the whitelist for **/${commandName}**.`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`[ADMIN] User ${targetUser.username} removed from /${commandName} whitelist by ${interaction.user.username}`);
        } else {
            // Remove all restrictions for this command
            result = db.prepare('DELETE FROM command_whitelist WHERE command_name = ?').run(commandName);

            if (result.changes === 0) {
                return interaction.reply({
                    content: `❌ Command **/${commandName}** has no restrictions.`,
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setColor(config.theme.colors.success)
                .setTitle('🔓 Command Unrestricted')
                .setDescription(`All restrictions have been removed from **/${commandName}**. (${result.changes} users removed)`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed], ephemeral: true });
            console.log(`[ADMIN] All restrictions removed from /${commandName} by ${interaction.user.username}`);
        }
    } catch (error) {
        console.error('Error unrestricting command:', error);
        await interaction.reply({
            content: 'An error occurred while unrestricting the command.',
            ephemeral: true
        });
    }
}

async function handleListDisabled(interaction) {
    try {
        const disabledCommands = db.prepare('SELECT * FROM disabled_commands ORDER BY command_name').all();

        if (disabledCommands.length === 0) {
            return interaction.reply({
                content: 'No commands are currently disabled.',
                ephemeral: true
            });
        }

        const commandList = disabledCommands.map(cmd => `• **/${cmd.command_name}**`).join('\n');

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.warning)
            .setTitle('🚫 Disabled Commands')
            .setDescription(commandList)
            .setFooter({ text: `${disabledCommands.length} command(s) disabled` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error listing disabled commands:', error);
        await interaction.reply({
            content: 'An error occurred while listing disabled commands.',
            ephemeral: true
        });
    }
}

async function handleListRestrictions(interaction) {
    const commandName = interaction.options.getString('command');

    try {
        let restrictions;
        let title;

        if (commandName) {
            restrictions = db.prepare('SELECT * FROM command_whitelist WHERE command_name = ?').all(commandName);
            title = `🔒 Restrictions for /${commandName}`;
        } else {
            restrictions = db.prepare('SELECT * FROM command_whitelist ORDER BY command_name').all();
            title = '🔒 All Command Restrictions';
        }

        if (restrictions.length === 0) {
            return interaction.reply({
                content: commandName
                    ? `Command **/${commandName}** has no restrictions.`
                    : 'No commands have restrictions.',
                ephemeral: true
            });
        }

        // Group by command if showing all
        const grouped = {};
        restrictions.forEach(r => {
            if (!grouped[r.command_name]) {
                grouped[r.command_name] = [];
            }
            grouped[r.command_name].push(`<@${r.discord_id}>`);
        });

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle(title)
            .setFooter({ text: `${restrictions.length} restriction(s) total` })
            .setTimestamp();

        Object.keys(grouped).sort().forEach(cmd => {
            embed.addFields({
                name: `/${cmd}`,
                value: grouped[cmd].join(', '),
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error listing restrictions:', error);
        await interaction.reply({
            content: 'An error occurred while listing restrictions.',
            ephemeral: true
        });
    }
}
