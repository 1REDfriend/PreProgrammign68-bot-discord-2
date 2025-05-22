const { ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { prisma } = require("../../../utils/Database");

/**
 * แสดงรายการตั๋วตามหน้าที่กำหนด
 * @param {ChatInputCommandInteraction} interaction 
 * @param {Object} pageData 
 */
async function displayTicketPage(interaction, pageData) {
    const { options, currentPage, pageSize, totalPages, filter } = pageData;

    // กรองตามสถานะหากมีการระบุ
    let filteredOptions = options;
    if (filter === 'open') {
        filteredOptions = options.filter(option => option.emoji === '🟢');
    } else if (filter === 'closed') {
        filteredOptions = options.filter(option => option.emoji === '🔴');
    }

    // คำนวณจำนวนหน้าใหม่หลังจากการกรอง
    const filteredTotalPages = Math.ceil(filteredOptions.length / pageSize);

    // ตรวจสอบว่าหน้าปัจจุบันยังคงถูกต้องหลังการกรอง
    const adjustedCurrentPage = Math.min(currentPage, filteredTotalPages - 1);

    // ดึงเฉพาะตัวเลือกสำหรับหน้าปัจจุบัน
    const start = adjustedCurrentPage * pageSize;
    const end = start + pageSize;
    const pageOptions = filteredOptions.slice(start, end);

    // สร้าง embed
    const embed = new EmbedBuilder()
        .setTitle("ตั๋วที่มีอยู่")
        .setDescription(`เลือกตั๋วจากรายการด้านล่าง (หน้า ${adjustedCurrentPage + 1}/${filteredTotalPages || 1}):`)
        .setColor(0x0099FF);

    if (filteredOptions.length === 0) {
        embed.setDescription("ไม่พบตั๋วที่ตรงกับเงื่อนไขที่เลือก");
    }

    // สร้าง select menu
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('view-ticket')
        .setPlaceholder('เลือกตั๋ว')
        .addOptions(pageOptions.length > 0 ? pageOptions : [{
            label: 'ไม่พบตั๋วในขณะนี้',
            description: 'ไม่มีตั๋วที่ตรงกับเงื่อนไขที่เลือก',
            value: 'no_ticket'
        }]);

    // ปุ่มนำทางสำหรับการเปลี่ยนหน้า
    const navButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('prev-page')
            .setLabel('◀ ก่อนหน้า')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(adjustedCurrentPage === 0),
        new ButtonBuilder()
            .setCustomId('next-page')
            .setLabel('ถัดไป ▶')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(adjustedCurrentPage >= filteredTotalPages - 1 || filteredOptions.length === 0)
    );

    // ปุ่มกรองสถานะ
    const filterButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('filter-open')
            .setLabel('แสดงที่เปิดอยู่')
            .setStyle(filter === 'open' ? ButtonStyle.Primary : ButtonStyle.Success)
            .setEmoji('🟢'),
        new ButtonBuilder()
            .setCustomId('filter-closed')
            .setLabel('แสดงที่ปิดแล้ว')
            .setStyle(filter === 'closed' ? ButtonStyle.Primary : ButtonStyle.Danger)
            .setEmoji('🔴'),
        new ButtonBuilder()
            .setCustomId('filter-all')
            .setLabel('แสดงทั้งหมด')
            .setStyle(filter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji('📋')
    );

    // อัพเดตหรือตอบกลับข้อความ
    const messagePayload = {
        embeds: [embed],
        components: [
            new ActionRowBuilder().addComponents(selectMenu),
            navButtons,
            filterButtons
        ],
        ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply(messagePayload);
    } else {
        await interaction.reply(messagePayload);
    }
}

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

    // สร้าง collection ในรูปแบบ user ID -> tickets สำหรับคำสั่งนี้
    const ticketCollection = new Map();
    interaction.client.ticketsPageData = interaction.client.ticketsPageData || ticketCollection;
    const userId = interaction.user.id;

    // สร้างตัวเลือกทั้งหมด
    const allTicketOptions = await Promise.all(tickets.map(async ticket => {
        const fetchedUser = await client.users.fetch(ticket.user_id).catch(() => null);
        const username = fetchedUser ? fetchedUser.username : 'ผู้ใช้ที่ไม่รู้จัก';

        return {
            label: `${ticket.title.substring(0, 80)} (${username})`,
            description: `สถานะ: ${ticket.status === 'open' ? 'เปิด' : 'ปิด'} | ${new Date(ticket.created_at).toLocaleDateString("th-TH")}`,
            value: ticket.ticket_id,
            emoji: ticket.status === 'open' ? '🟢' : '🔴'
        };
    }));

    // เก็บข้อมูลทั้งหมดสำหรับการแบ่งหน้า
    const pageSize = 25; // จำนวนรายการต่อหน้า
    const pageData = {
        options: allTicketOptions,
        currentPage: 0,
        pageSize: pageSize,
        totalPages: Math.ceil(allTicketOptions.length / pageSize),
        filter: 'all' // ค่าเริ่มต้นแสดงทั้งหมด
    };

    // บันทึกข้อมูลสำหรับผู้ใช้คนนี้
    interaction.client.ticketsPageData.set(userId, pageData);

    await displayTicketPage(interaction, pageData);
};

// Export ฟังก์ชัน displayTicketPage เพื่อให้ไฟล์อื่นสามารถเรียกใช้ได้
module.exports.displayTicketPage = displayTicketPage;
