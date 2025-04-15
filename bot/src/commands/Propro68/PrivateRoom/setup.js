const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ChatInputCommandInteraction } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const DiscordBot = require("../../../client/DiscordBot");
const { error, info } = require("../../../utils/Console");

const prisma = new PrismaClient();

/**
 * 
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function setupPrivateRoom(client, interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        const title = interaction.options.getString("title");
        const description = interaction.options.getString("description") || "Click a button below to create a private room.";
        const targetChannel = interaction.options.getChannel("channel");
        const targetCategory = interaction.options.getChannel("category");
        const staffRole = interaction.options.getRole("role");

        // Check if there's already a configuration for this guild
        const existingConfig = await prisma.privateRoom.findUnique({
            where: { guild_id: interaction.guildId }
        });

        // Create or update the configuration
        if (existingConfig) {
            await prisma.privateRoom.update({
                where: { guild_id: interaction.guildId },
                data: {
                    channel_id: targetChannel.id,
                    category_id: targetCategory.id,
                    role_id: staffRole.id,
                    updated_at: new Date()
                }
            });
        } else {
            await prisma.privateRoom.create({
                data: {
                    guild_id: interaction.guildId,
                    channel_id: targetChannel.id,
                    category_id: targetCategory.id,
                    role_id: staffRole.id
                }
            });
        }

        // Create embed message with buttons
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor("#5865F2")
            .setTimestamp();

        // Create buttons
        const userSelectionButton = new ButtonBuilder()
            .setCustomId("create_private_room_with_users")
            .setLabel("Create Room with Selected Users")
            .setStyle(ButtonStyle.Primary);

        const roleSelectionButton = new ButtonBuilder()
            .setCustomId("create_private_room_with_role")
            .setLabel("Create Room with Role")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(userSelectionButton, roleSelectionButton);

        // Send the embed with buttons to the target channel
        await targetChannel.send({
            embeds: [embed],
            components: [row]
        });

        await interaction.editReply({
            content: `Private room system has been set up successfully in <#${targetChannel.id}>!`,
            ephemeral: true
        });

        info(`${interaction.guild.name}: Private room system setup by ${interaction.user.tag}`);
    } catch (err) {
        error(`Error setting up private room system: ${err.message}`);
        await interaction.editReply({
            content: `Failed to set up private room system: ${err.message}`,
            ephemeral: true
        });
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = setupPrivateRoom; 