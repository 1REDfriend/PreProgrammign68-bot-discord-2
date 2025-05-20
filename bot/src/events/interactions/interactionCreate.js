// ค้นหาบริเวณที่มีการจัดการ interactions และเพิ่มโค้ดการจัดการปุ่มในระบบแบ่งหน้าตั๋ว

const Event = require("../../structure/Event");

module.exports = new Event({
    event: 'interactionCreate',
    once: false,
    run: async (__client__, interaction) => {
        const client = __client__;
        
        // จัดการกับปุ่มสำหรับระบบแบ่งหน้าตั๋ว
        if (interaction.isButton()) {
            if (interaction.customId === 'next-page' || interaction.customId === 'prev-page' ||
                interaction.customId === 'filter-open' || interaction.customId === 'filter-closed' ||
                interaction.customId === 'filter-all') {

                const userId = interaction.user.id;
                // ตรวจสอบว่ามีข้อมูลของผู้ใช้นี้หรือไม่
                if (!client.ticketsPageData || !client.ticketsPageData.has(userId)) {
                    return interaction.reply({
                        content: "ข้อมูลเซสชันหมดอายุแล้ว กรุณาใช้คำสั่งใหม่อีกครั้ง",
                        ephemeral: true
                    });
                }

                // ดึงข้อมูลปัจจุบัน
                const pageData = client.ticketsPageData.get(userId);

                // จัดการกับปุ่มเปลี่ยนหน้า
                if (interaction.customId === 'next-page') {
                    if (pageData.currentPage < pageData.totalPages - 1) {
                        pageData.currentPage += 1;
                    }
                } else if (interaction.customId === 'prev-page') {
                    if (pageData.currentPage > 0) {
                        pageData.currentPage -= 1;
                    }
                }
                // จัดการกับปุ่มกรอง
                else if (interaction.customId === 'filter-open') {
                    pageData.filter = 'open';
                    pageData.currentPage = 0; // รีเซ็ตหน้าเมื่อเปลี่ยนตัวกรอง
                } else if (interaction.customId === 'filter-closed') {
                    pageData.filter = 'closed';
                    pageData.currentPage = 0;
                } else if (interaction.customId === 'filter-all') {
                    pageData.filter = 'all';
                    pageData.currentPage = 0;
                }

                // บันทึกข้อมูลกลับ
                client.ticketsPageData.set(userId, pageData);

                // เรียกใช้ฟังก์ชันแสดงหน้า
                const findTicketsHandler = require('../../commands/Propro68/Tickets/find');
                if (typeof findTicketsHandler.displayTicketPage === 'function') {
                    await findTicketsHandler.displayTicketPage(interaction, pageData);
                } else {
                    return interaction.reply({
                        content: "เกิดข้อผิดพลาด: ไม่พบฟังก์ชันแสดงผลตั๋ว",
                        ephemeral: true
                    });
                }
                return;
            }
        }

        // ส่วนจัดการกับ slash commands ถูกลบออกแล้ว เพื่อป้องกันการทำงานซ้ำซ้อนกับ CommandsListener.js
    }
}).toJSON(); 