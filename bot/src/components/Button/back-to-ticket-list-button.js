const { ButtonInteraction } = require("discord.js");
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

            // สร้าง collection หากไม่มี
            const userId = interaction.user.id;
            client.ticketsPageData = client.ticketsPageData || new Map();

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
            client.ticketsPageData.set(userId, pageData);

            // เรียกใช้ฟังก์ชัน displayTicketPage จาก find.js
            const findTicketsHandler = require('../../commands/Propro68/Tickets/find');
            if (typeof findTicketsHandler.displayTicketPage === 'function') {
                await findTicketsHandler.displayTicketPage(interaction, pageData);
            } else {
                console.error('Error: displayTicketPage function not found in find.js');
                await interaction.update({
                    content: `เกิดข้อผิดพลาด: ไม่พบฟังก์ชันแสดงรายการตั๋ว`,
                    components: [],
                    ephemeral: true
                });
            }
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