const { ChatInputCommandInteraction } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const DiscordBot = require("../../../client/DiscordBot");
const { error, info } = require("../../../utils/Console");

const prisma = new PrismaClient();

/**
 * 
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function uninstallPrivateRoom(client, interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
        // Check if there's a configuration for this guild
        const existingConfig = await prisma.privateRoom.findUnique({
            where: { guild_id: interaction.guildId }
        });

        if (!existingConfig) {
            return await interaction.editReply({
                content: "Private room system is not currently set up for this server.",
                ephemeral: true
            });
        }

        // Delete the configuration
        await prisma.privateRoom.delete({
            where: { guild_id: interaction.guildId }
        });

        await interaction.editReply({
            content: "Private room system has been successfully uninstalled.",
            ephemeral: true
        });

        info(`${interaction.guild.name}: Private room system uninstalled by ${interaction.user.tag}`);
    } catch (err) {
        error(`Error uninstalling private room system: ${err.message}`);
        await interaction.editReply({
            content: `Failed to uninstall private room system: ${err.message}`,
            ephemeral: true
        });
    } finally {
        await prisma.$disconnect();
    }
}

module.exports = uninstallPrivateRoom; 