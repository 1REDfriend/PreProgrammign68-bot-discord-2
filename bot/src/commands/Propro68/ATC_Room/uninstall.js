const { ChatInputCommandInteraction} = require("discord.js");
const { PrismaClient } = require('@prisma/client');
const { EmbedBuilder } = require('discord.js');
const DiscordBot = require("../../../client/DiscordBot");
const prisma = new PrismaClient();

/**
 * Uninstall auto create room functionality
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function uninstallAutoCreateRoom(client, interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        // Check if setup exists for this guild
        const existingSetup = await prisma.autoCreateRoom.findUnique({
            where: {
                guild_id: interaction.guild.id
            }
        });

        if (!existingSetup) {
            return interaction.editReply({
                content: 'ไม่พบการตั้งค่าระบบสร้างห้องอัตโนมัติสำหรับเซิร์ฟเวอร์นี้',
                ephemeral: true
            });
        }

        // Delete the setup from database
        await prisma.autoCreateRoom.delete({
            where: {
                guild_id: interaction.guild.id
            }
        });

        // Create success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('🗑️ ถอนการติดตั้งสำเร็จ')
            .setDescription('ได้ถอนการติดตั้งระบบสร้างห้องอัตโนมัติเรียบร้อยแล้ว')
            .setColor('#FF0000')
            .setTimestamp();

        return interaction.editReply({
            embeds: [successEmbed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Error uninstalling auto create room:', error);

        return interaction.editReply({
            content: `เกิดข้อผิดพลาด: ${error.message}`,
            ephemeral: true
        });
    }
}

module.exports = { uninstallAutoCreateRoom }; 