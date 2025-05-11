const { ChatInputCommandInteraction, EmbedBuilder, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info, error } = require("../../../utils/Console");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Subcommand handler for ticket uninstall
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return interaction.reply({
            content: "You do not have permission to use this command.",
            ephemeral: true
        });
    }

    const confirm = interaction.options.getBoolean('confirm');

    if (!confirm) {
        return interaction.reply({
            content: "⚠️ คุณต้องยืนยันการลบการตั้งค่า Ticket โดยการตั้งค่า `confirm` เป็น `true`",
            ephemeral: true
        });
    }

    try {
        // ตรวจสอบว่ามีการตั้งค่า Ticket สำหรับเซิร์ฟเวอร์นี้หรือไม่
        const ticketConfig = await prisma.ticket.findUnique({
            where: { guild_id: interaction.guildId }
        });

        if (!ticketConfig) {
            return interaction.reply({
                content: "❌ ไม่พบการตั้งค่า Ticket สำหรับเซิร์ฟเวอร์นี้",
                ephemeral: true
            });
        }

        // ดึงข้อมูลจำนวน ticket log ทั้งหมดที่จะยังคงเก็บไว้
        const ticketLogs = await prisma.ticketLog.count({
            where: { guild_id: interaction.guildId }
        });

        // ลบข้อมูลการตั้งค่า Ticket แต่ไม่ลบ log
        await prisma.ticket.delete({
            where: { guild_id: interaction.guildId }
        });

        // สร้าง embed สำหรับแสดงผลการลบ
        const embed = new EmbedBuilder()
            .setTitle("🗑️ ลบการตั้งค่า Ticket สำเร็จ")
            .setDescription(`ได้ลบการตั้งค่า Ticket สำหรับเซิร์ฟเวอร์ ${interaction.guild.name} เรียบร้อยแล้ว`)
            .addFields(
                { name: "📊 บันทึก Ticket", value: `ยังคงเก็บประวัติ Ticket จำนวน ${ticketLogs} รายการไว้ในระบบ`, inline: true }
            )
            .setColor(0xED4245) // สีแดง Discord
            .setTimestamp();

        info(`[${interaction.guild.name}] Admin ${interaction.user.username} has uninstalled the Ticket system`);

        return interaction.reply({
            embeds: [embed],
            ephemeral: true
        });
    } catch (err) {
        error(`Failed to uninstall ticket for server ${interaction.guildId}: ${err.message}`);
        return interaction.reply({
            content: `⚠️ เกิดข้อผิดพลาดในการลบการตั้งค่า Ticket: ${err.message}`,
            ephemeral: true
        });
    } finally {
        await prisma.$disconnect();
    }
}; 