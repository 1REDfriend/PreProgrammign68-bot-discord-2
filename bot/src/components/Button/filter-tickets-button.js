const { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { prisma } = require("../../utils/Database");

module.exports = new Component({
    customId: /^filter-(open|closed|all)$/,
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            const filterType = interaction.customId.split('-')[1]; // ดึงประเภทการกรอง (open, closed, all)
            
            // กำหนดเงื่อนไขการค้นหาตามประเภทตัวกรอง
            let whereCondition = { guild_id: interaction.guildId };
            
            if (filterType === 'open') {
                whereCondition.status = 'open';
            } else if (filterType === 'closed') {
                whereCondition.status = 'closed';
            }
            
            // ค้นหาตั๋วตามเงื่อนไข
            const tickets = await prisma.ticketLog.findMany({
                where: whereCondition,
                orderBy: { created_at: 'desc' }
            });

            if (tickets.length === 0) {
                return await interaction.update({
                    content: `ไม่พบตั๋วที่${filterType === 'open' ? 'เปิดอยู่' : filterType === 'closed' ? 'ปิดแล้ว' : ''}ในเซิร์ฟเวอร์นี้`,
                    embeds: [],
                    components: [createFilterButtons()],
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
                .setTitle(`ตั๋ว${filterType === 'open' ? 'ที่เปิดอยู่' : filterType === 'closed' ? 'ที่ปิดแล้ว' : 'ทั้งหมด'}`)
                .setDescription(`พบ ${tickets.length} ตั๋ว${filterType === 'open' ? 'ที่เปิดอยู่' : filterType === 'closed' ? 'ที่ปิดแล้ว' : 'ทั้งหมด'}:`)
                .setColor(filterType === 'open' ? 0x00FF00 : filterType === 'closed' ? 0xFF0000 : 0x0099FF);

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('view-ticket')
                .setPlaceholder('เลือกตั๋ว')
                .addOptions(ticketOptions);

            await interaction.update({
                content: null,
                embeds: [embed],
                components: [
                    new ActionRowBuilder().addComponents(selectMenu),
                    createFilterButtons(filterType)
                ],
                ephemeral: true
            });
        } catch (err) {
            console.error(`Error handling filter-tickets: ${err}`);
            await interaction.update({
                content: `เกิดข้อผิดพลาดในการกรองตั๋ว: ${err.message}`,
                components: [],
                ephemeral: true
            });
        }
    }
}).toJSON();

/**
 * สร้างปุ่มกรองตั๋ว
 * @param {string} activeFilter ตัวกรองที่กำลังใช้งานอยู่
 * @returns {ActionRowBuilder} แถวของปุ่มกรอง
 */
function createFilterButtons(activeFilter = null) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('filter-open')
            .setLabel('แสดงที่เปิดอยู่')
            .setStyle(activeFilter === 'open' ? ButtonStyle.Primary : ButtonStyle.Success)
            .setEmoji('🟢')
            .setDisabled(activeFilter === 'open'),
        new ButtonBuilder()
            .setCustomId('filter-closed')
            .setLabel('แสดงที่ปิดแล้ว')
            .setStyle(activeFilter === 'closed' ? ButtonStyle.Primary : ButtonStyle.Danger)
            .setEmoji('🔴')
            .setDisabled(activeFilter === 'closed'),
        new ButtonBuilder()
            .setCustomId('filter-all')
            .setLabel('แสดงทั้งหมด')
            .setStyle(activeFilter === 'all' ? ButtonStyle.Primary : ButtonStyle.Secondary)
            .setEmoji('📋')
            .setDisabled(activeFilter === 'all')
    );
} 