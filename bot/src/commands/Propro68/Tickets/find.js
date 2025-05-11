const { ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
/**
 * Subcommand handler for ticket find
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers) && !interaction.member.roles.cache.some(role => role.name.startsWith('{') || role.name.endsWith('}'))) {
        return interaction.reply({
            content: "You do not have permission to use this command.",
            ephemeral: true
        });
    }
    const showClosed = interaction.options.getBoolean('show_closed') ?? true; // แสดงตั๋วที่ปิดแล้วด้วย
    // ค้นหาตั๋วทั้งหมดในเซิร์ฟเวอร์
    const tickets = await prisma.ticketLog.findMany({
        where: {
            guild_id: interaction.guildId,
            ...(showClosed ? {} : { status: 'open' })
        },
        orderBy: { created_at: 'desc' }
    });

    if (tickets.length === 0) {
        return await interaction.reply({
            content: "ไม่พบตั๋วในฐานข้อมูลสำหรับเซิร์ฟเวอร์นี้",
            ephemeral: true
        });
    }

    const ticketOptions = await Promise.all(tickets.map(async ticket => {
        const fetchedUser = await client.users.fetch(ticket.user_id).catch(() => null);
        const username = fetchedUser ? fetchedUser.username : 'ผู้ใช้ที่ไม่รู้จัก';

        return {
            label: `${ticket.title.substring(0, 80)} (${username})`,
            description: `สถานะ: ${ticket.status === 'open' ? 'เปิด' : 'ปิด'} | ${new Date(ticket.created_at).toLocaleDateString("th-TH")}`,
            value: ticket.ticket_id,
            emoji: ticket.status === 'open' ? '🟢' : '🔴'
        };
    }));

    const embed = new EmbedBuilder()
        .setTitle("ตั๋วที่มีอยู่")
        .setDescription("เลือกตั๋วจากรายการด้านล่าง:")
        .setColor(0x0099FF);

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('view-ticket')
        .setPlaceholder('เลือกตั๋ว')
        .addOptions(ticketOptions);

    const filterButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('filter-open')
            .setLabel('แสดงที่เปิดอยู่')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🟢'),
        new ButtonBuilder()
            .setCustomId('filter-closed')
            .setLabel('แสดงที่ปิดแล้ว')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔴'),
        new ButtonBuilder()
            .setCustomId('filter-all')
            .setLabel('แสดงทั้งหมด')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📋')
    );

    await interaction.reply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(selectMenu), filterButtons],
        ephemeral: true
    });
};
