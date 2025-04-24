const { EmbedBuilder, PermissionFlagsBits, ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { error } = require("../../../utils/Console");
const { prisma } = require("../../../utils/Database");

/**
 * Subcommand handler for verifly setup
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    // ตรวจสอบสิทธิ์ admin
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const errorEmbed = new EmbedBuilder()
            .setTitle('ข้อผิดพลาด')
            .setDescription('คุณไม่มีสิทธิ์ในการตั้งค่าระบบยืนยันตัวตน')
            .setColor(0xFF0000)
            .setFooter({ text: 'Verification Error' })
            .setTimestamp();
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const verifyRole = interaction.options.getRole('role');
    const logChannel = interaction.options.getChannel('log_channel');

    // บันทึกค่า role และ channel ลงในฐานข้อมูลสำหรับ server นี้
    try {
        await prisma.serverSettings.upsert({
            where: { guildId: interaction.guildId },
            update: { 
                verifyRoleId: verifyRole.id,
                verifyLogChannelId: logChannel ? logChannel.id : null
            },
            create: {
                guildId: interaction.guildId,
                verifyRoleId: verifyRole.id,
                verifyLogChannelId: logChannel ? logChannel.id : null,
                updatedAt: Date.now()
            }
        });

        const successEmbed = new EmbedBuilder()
            .setTitle('ตั้งค่าสำเร็จ')
            .setDescription(`กำหนด role สำหรับการยืนยันตัวตนเป็น ${verifyRole.name} ${logChannel ? `และช่องบันทึกเป็น ${logChannel.name}` : ''} เรียบร้อย`)
            .setColor(0x00FF00)
            .setFooter({ text: 'Setup Complete' })
            .setTimestamp();

        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (err) {
        error(`Database error: ${err.message}`);
        return interaction.reply({
            content: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่ภายหลัง',
            ephemeral: true
        });
    }
}; 