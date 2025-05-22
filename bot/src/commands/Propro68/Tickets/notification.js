const { ChatInputCommandInteraction, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info } = require("../../../utils/Console");
const { prisma } = require("../../../utils/Database");

/**
 * Subcommand handler for ticket notification setup
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            content: "คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้",
            ephemeral: true
        });
    }

    const notificationChannel = interaction.options.getChannel('channel');
    const notificationRole = interaction.options.getRole('role');

    if (!notificationChannel.isTextBased()) {
        return interaction.reply({
            content: "ช่องสำหรับการแจ้งเตือนต้องเป็นช่องข้อความเท่านั้น",
            ephemeral: true
        });
    }

    try {
        // ตรวจสอบว่าเซิร์ฟเวอร์นี้มีการตั้งค่า ticket ไว้แล้วหรือไม่
        const ticketConfig = await prisma.ticket.findUnique({
            where: { guild_id: interaction.guildId }
        });

        if (!ticketConfig) {
            return interaction.reply({
                content: "ยังไม่มีการตั้งค่า ticket สำหรับเซิร์ฟเวอร์นี้ โปรดใช้คำสั่ง `/ticket setup` ก่อน",
                ephemeral: true
            });
        }

        // อัปเดตการตั้งค่าการแจ้งเตือน
        await prisma.ticket.update({
            where: { guild_id: interaction.guildId },
            data: {
                notification_channel_id: notificationChannel.id,
                notification_role_id: notificationRole ? notificationRole.id : null
            }
        });

        await interaction.reply({
            content: `ตั้งค่าการแจ้งเตือน ticket สำเร็จแล้ว!\nช่องแจ้งเตือน: ${notificationChannel}${notificationRole ? `\nบทบาทที่จะถูกแจ้งเตือน: ${notificationRole}` : ''}`,
            ephemeral: true
        });

        info(`Ticket notification settings updated by ${interaction.user.displayName} in ${interaction.guild.name}`);
    } catch (error) {
        console.error('Failed to setup ticket notification:', error.message);
        return interaction.reply({
            content: "เกิดข้อผิดพลาดในการตั้งค่าการแจ้งเตือน ticket",
            ephemeral: true
        });
    } finally {
        await prisma.$disconnect();
    }
}; 