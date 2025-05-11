const { ButtonInteraction, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = new Component({
    customId: 'back-to-ticket-list',
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            // ค้นหาตั๋วทั้งหมดในเซิร์ฟเวอร์
            const tickets = await prisma.ticketLog.findMany({
                where: { 
                    guild_id: interaction.guildId
                },
                orderBy: { created_at: 'desc' }
            });

            if (tickets.length === 0) {
                return await interaction.update({
                    content: "ไม่พบตั๋วในฐานข้อมูลสำหรับเซิร์ฟเวอร์นี้",
                    embeds: [],
                    components: [],
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

            await interaction.update({
                content: null,
                embeds: [embed],
                components: [new ActionRowBuilder().addComponents(selectMenu), filterButtons],
                ephemeral: true
            });
        } catch (err) {
            console.error(`Error handling back-to-ticket-list: ${err}`);
            await interaction.update({
                content: `เกิดข้อผิดพลาดในการกลับไปยังรายการตั๋ว: ${err.message}`,
                components: [],
                ephemeral: true
            });
        }
    }
}).toJSON(); 