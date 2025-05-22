const { ModalSubmitInteraction, PermissionsBitField, ChannelType } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { error, info } = require("../../utils/Console");
const { prisma } = require("../../utils/Database");

module.exports = new Component({
    customId: 'create_private_room_users_modal',
    type: 'modal',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ModalSubmitInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Get values from the modal
            const roomName = interaction.fields.getTextInputValue('room_name');
            const userIdsInput = interaction.fields.getTextInputValue('user_ids');
            const roomDescription = interaction.fields.getTextInputValue('room_description') || '';

            // Get server configuration
            const config = await prisma.privateRoom.findUnique({
                where: { guild_id: interaction.guildId }
            });

            if (!config) {
                return await interaction.editReply({
                    content: "Private room system is not set up for this server. Please contact an administrator.",
                    ephemeral: true
                });
            }

            // Parse user IDs
            const userIds = userIdsInput
                .split(',')
                .map(id => id.trim())
                .map(id => id.replace(/[<@!>]/g, ''))  // Remove Discord mention formatting
                .filter(id => id.length > 0);

            if (userIds.length === 0) {
                return await interaction.editReply({
                    content: "Please provide at least one valid user ID.",
                    ephemeral: true
                });
            }

            // Validate users exist
            const validUserIds = [];
            for (const userId of userIds) {
                try {
                    const user = await client.users.fetch(userId);
                    validUserIds.push(userId);
                } catch (err) {
                    // User ID is invalid, skip it
                    continue;
                }
            }

            if (validUserIds.length === 0) {
                return await interaction.editReply({
                    content: "None of the provided user IDs were valid.",
                    ephemeral: true
                });
            }

            // Include the room creator
            if (!validUserIds.includes(interaction.user.id)) {
                validUserIds.push(interaction.user.id);
            }

            // Create permission overwrites
            const permissionOverwrites = [
                // Deny everyone access by default
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect
                    ]
                },
                // Allow configured role access
                {
                    id: config.role_id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak
                    ]
                }
            ];

            // Add permissions for selected users
            for (const userId of validUserIds) {
                permissionOverwrites.push({
                    id: userId,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak
                    ]
                });
            }

            // Create the voice channel
            const voiceChannel = await interaction.guild.channels.create({
                name: roomName,
                type: ChannelType.GuildVoice,
                parent: config.category_id,
                permissionOverwrites: permissionOverwrites,
                reason: `Private room created by ${interaction.user.tag}`
            });

            // Record in database
            await prisma.privateRoomChannel.create({
                data: {
                    channel_id: voiceChannel.id,
                    guild_id: interaction.guildId,
                    created_by: interaction.user.id,
                    name: roomName,
                    description: roomDescription,
                    type: 'USER'
                }
            });

            await interaction.editReply({
                content: `Private room created successfully! <#${voiceChannel.id}>`,
                ephemeral: true
            });

            info(`${interaction.guild.name}: Private room with users created by ${interaction.user.tag}`);
        } catch (err) {
            error(`Error creating private room with users: ${err.message}`);
            await interaction.editReply({
                content: `Failed to create private room: ${err.message}`,
                ephemeral: true
            });
        } finally {
            await prisma.$disconnect();
        }
    }
}).toJSON(); 