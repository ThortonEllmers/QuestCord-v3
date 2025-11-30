const { UserModel, ActivityLogModel } = require('../../database/models');
const { broadcastActivity } = require('../../web/server');
const { getReportingInstance } = require('../../utils/reportingSystem');
const { handleQuestAccept, handleCombatAttack, handleExplorationContinue, handleReactionClick } = require('../utils/questInteractions');
const { handleShopPurchase, handleShopCancel } = require('../utils/shopInteractions');
const { handlePvpAccept, handlePvpDecline, handlePvpAttack } = require('../utils/pvpArena');
const { isStaff } = require('../utils/permissions');
const { db } = require('../../database/schema');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions for quests
        if (interaction.isButton()) {
            try {
                if (interaction.customId.startsWith('accept_quest_')) {
                    return await handleQuestAccept(interaction);
                }
                if (interaction.customId.startsWith('combat_attack_')) {
                    return await handleCombatAttack(interaction);
                }
                if (interaction.customId.startsWith('explore_continue_')) {
                    return await handleExplorationContinue(interaction);
                }
                if (interaction.customId === 'reaction_button') {
                    return await handleReactionClick(interaction);
                }
                // Shop purchase buttons
                if (interaction.customId.startsWith('confirm_buy_')) {
                    return await handleShopPurchase(interaction);
                }
                if (interaction.customId === 'cancel_buy') {
                    return await handleShopCancel(interaction);
                }
                // PVP Arena buttons
                if (interaction.customId.startsWith('pvp_accept_')) {
                    const { activeChallenges, arenaeBattles } = require('../commands/pvp');
                    const challengeKey = interaction.customId.replace('pvp_accept_', '');
                    return await handlePvpAccept(interaction, challengeKey, activeChallenges, arenaeBattles);
                }
                if (interaction.customId.startsWith('pvp_decline_')) {
                    const { activeChallenges } = require('../commands/pvp');
                    const challengeKey = interaction.customId.replace('pvp_decline_', '');
                    return await handlePvpDecline(interaction, challengeKey, activeChallenges);
                }
                if (interaction.customId.startsWith('pvp_battle_attack_')) {
                    const { arenaeBattles } = require('../commands/pvp');
                    const battleId = interaction.customId.replace('pvp_battle_attack_', '');
                    return await handlePvpAttack(interaction, battleId, arenaeBattles);
                }
                // Help menu buttons
                if (interaction.customId === 'help_tutorial') {
                    const tutorialCommand = interaction.client.commands.get('tutorial');
                    if (tutorialCommand) {
                        await interaction.deferReply({ ephemeral: true });
                        // Execute the command and capture its response
                        try {
                            // Temporarily override reply to use followUp
                            const originalReply = interaction.reply;
                            interaction.reply = async (options) => {
                                return await interaction.editReply(options);
                            };
                            await tutorialCommand.execute(interaction);
                            interaction.reply = originalReply;
                        } catch (err) {
                            await interaction.editReply({ content: 'Failed to load tutorial.', ephemeral: true });
                        }
                    }
                    return;
                }
                if (interaction.customId === 'help_quests') {
                    const questsCommand = interaction.client.commands.get('quests');
                    if (questsCommand) {
                        await interaction.deferReply({ ephemeral: true });
                        try {
                            const originalReply = interaction.reply;
                            interaction.reply = async (options) => {
                                return await interaction.editReply(options);
                            };
                            await questsCommand.execute(interaction);
                            interaction.reply = originalReply;
                        } catch (err) {
                            await interaction.editReply({ content: 'Failed to load quests.', ephemeral: true });
                        }
                    }
                    return;
                }
                if (interaction.customId === 'help_profile') {
                    const { LevelSystem } = require('../../utils/levelSystem');
                    const config = require('../../../config.json');
                    const { EmbedBuilder } = require('discord.js');

                    await interaction.deferReply({ ephemeral: true });
                    try {
                        const targetUser = interaction.user;
                        let user = UserModel.findByDiscordId(targetUser.id);

                        if (!user) {
                            UserModel.create(targetUser.id, targetUser.globalName || targetUser.username);
                            user = UserModel.findByDiscordId(targetUser.id);
                        }

                        const now = new Date();
                        const { LeaderboardModel } = require('../../database/models');
                        const rank = LeaderboardModel.getUserRank(user.id, now.getMonth() + 1, now.getFullYear());
                        const levelTitle = LevelSystem.getLevelTitle(user.level);
                        const progressBar = LevelSystem.getProgressBar(user.experience, LevelSystem.getRequiredExperience(user.level));

                        const embed = new EmbedBuilder()
                            .setColor(config.theme.colors.primary)
                            .setTitle(`${targetUser.username}'s Profile`)
                            .setDescription(`**${levelTitle}**`)
                            .setThumbnail(targetUser.displayAvatarURL())
                            .addFields(
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
                                    name: 'Quests Completed',
                                    value: user.quests_completed.toString(),
                                    inline: true
                                },
                                {
                                    name: 'Bosses Defeated',
                                    value: user.bosses_defeated.toString(),
                                    inline: true
                                },
                                {
                                    name: 'Monthly Rank',
                                    value: rank ? `#${rank}` : 'Unranked',
                                    inline: true
                                }
                            )
                            .setFooter({ text: `User ID: ${targetUser.id}` });

                        await interaction.editReply({ embeds: [embed] });
                    } catch (err) {
                        console.error('Error loading profile:', err);
                        await interaction.editReply({ content: 'Failed to load profile.', ephemeral: true });
                    }
                    return;
                }
            } catch (error) {
                console.error('Error handling button interaction:', error);
                const reporting = getReportingInstance();
                if (reporting) {
                    reporting.sendErrorReport(error, `Button interaction: ${interaction.customId}`);
                }

                if (!interaction.replied && !interaction.deferred) {
                    await interaction.reply({
                        content: 'An error occurred while processing your action.',
                        ephemeral: true
                    });
                }
            }
            return;
        }

        // Handle autocomplete interactions
        if (interaction.isAutocomplete()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command || !command.autocomplete) {
                return;
            }

            try {
                await command.autocomplete(interaction);
            } catch (error) {
                console.error('Error handling autocomplete:', error);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        // Check if command is globally disabled
        const disabledCommand = db.prepare('SELECT * FROM disabled_commands WHERE command_name = ?').get(interaction.commandName);
        if (disabledCommand) {
            return interaction.reply({
                content: `❌ The **/${interaction.commandName}** command is currently disabled.`,
                ephemeral: true
            });
        }

        // Check if command has restrictions (whitelist)
        const restrictions = db.prepare('SELECT * FROM command_whitelist WHERE command_name = ?').all(interaction.commandName);
        if (restrictions.length > 0) {
            // Command has restrictions - check if user is whitelisted or is staff
            const userIsStaff = await isStaff(interaction);
            const userIsWhitelisted = restrictions.some(r => r.discord_id === interaction.user.id);

            if (!userIsStaff && !userIsWhitelisted) {
                return interaction.reply({
                    content: `❌ You don't have permission to use **/${interaction.commandName}**.`,
                    ephemeral: true
                });
            }
        }

        try {
            let user = UserModel.findByDiscordId(interaction.user.id);
            if (!user) {
                // Use display name (global name) if available, otherwise username
                const displayName = interaction.user.globalName || interaction.user.username;
                UserModel.create(interaction.user.id, displayName);
                user = UserModel.findByDiscordId(interaction.user.id);
            } else {
                // Update username if it changed
                const displayName = interaction.user.globalName || interaction.user.username;
                if (user.username !== displayName) {
                    UserModel.create(interaction.user.id, displayName); // Updates on conflict
                }
            }

            const timestamp = Math.floor(Date.now() / 1000);
            const action = `Used command: /${interaction.commandName}`;
            const displayName = interaction.user.globalName || interaction.user.username;

            ActivityLogModel.log(
                user.id,
                displayName,
                action,
                JSON.stringify({ guild: interaction.guild?.name || 'DM' })
            );

            broadcastActivity({
                user_id: user.id,
                username: displayName,
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
