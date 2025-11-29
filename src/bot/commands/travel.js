const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { UserModel, ServerModel } = require('../../database/models');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('travel')
        .setDescription('Travel to another server to find more quests'),

    async execute(interaction) {
        const user = UserModel.findByDiscordId(interaction.user.id);

        if (!user) {
            return interaction.reply({
                content: '❌ You need to complete a quest first before traveling!',
                ephemeral: true
            });
        }

        const now = Math.floor(Date.now() / 1000);

        // Check if user is currently traveling
        if (user.traveling) {
            const timeLeft = user.travel_arrival_time - now;

            if (timeLeft > 0) {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;

                const embed = new EmbedBuilder()
                    .setColor(config.theme.colors.warning)
                    .setTitle('🚢 Currently Traveling')
                    .setDescription(`You are traveling to **${user.travel_destination}**`)
                    .addFields({
                        name: '⏱️ Time Remaining',
                        value: `${minutes}m ${seconds}s`,
                        inline: true
                    })
                    .setFooter({ text: 'Check back when you arrive!' });

                return interaction.reply({ embeds: [embed], ephemeral: true });
            } else {
                // Travel completed
                UserModel.completeTravel(interaction.user.id);

                const embed = new EmbedBuilder()
                    .setColor(config.theme.colors.success)
                    .setTitle('✅ Journey Complete!')
                    .setDescription(`You have arrived at **${user.travel_destination}**!\n\nUse \`/quests\` to see what adventures await you here.`)
                    .setFooter({ text: 'Welcome to your destination!' });

                return interaction.reply({ embeds: [embed] });
            }
        }

        // Check travel cooldown
        const timeSinceLastTravel = now - (user.last_travel_time || 0);
        const cooldownRemaining = (config.travel.cooldown / 1000) - timeSinceLastTravel;

        if (cooldownRemaining > 0) {
            return interaction.reply({
                content: `⏳ You need to wait ${Math.ceil(cooldownRemaining)}s before traveling again.`,
                ephemeral: true
            });
        }

        // Get available servers (exclude current server)
        const allServers = ServerModel.getOptedInServers();
        const availableServers = allServers.filter(s => s.discord_id !== interaction.guildId);

        if (availableServers.length === 0) {
            return interaction.reply({
                content: '❌ No other servers available to travel to right now!',
                ephemeral: true
            });
        }

        // Select random destination
        const destination = availableServers[Math.floor(Math.random() * availableServers.length)];

        // Calculate random travel time
        const travelTime = Math.floor(
            Math.random() * (config.travel.maxTravelTime - config.travel.minTravelTime) + config.travel.minTravelTime
        ) / 1000; // Convert to seconds

        const arrivalTime = now + travelTime;

        // Start travel
        UserModel.startTravel(interaction.user.id, destination.name, arrivalTime);

        const minutes = Math.floor(travelTime / 60);
        const seconds = Math.floor(travelTime % 60);

        const embed = new EmbedBuilder()
            .setColor(config.theme.colors.primary)
            .setTitle('🚢 Journey Begun!')
            .setDescription(`You have started traveling to **${destination.name}**`)
            .addFields(
                {
                    name: '⏱️ Travel Time',
                    value: `${minutes}m ${seconds}s`,
                    inline: true
                },
                {
                    name: '📍 Members',
                    value: `${destination.member_count || 0} travelers`,
                    inline: true
                }
            )
            .setFooter({ text: `Use /travel again to check your progress` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
