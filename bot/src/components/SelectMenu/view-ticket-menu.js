const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { prisma } = require("../../utils/Database");

module.exports = new Component({
    customId: 'view-ticket',
    type: 'select',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {import("discord.js").AnySelectMenuInteraction} interaction 
     */
    run: async (client, interaction) => {
        const ticket_id = interaction.values[0];

        try {
            // ดึงข้อมูลตั๋ว
            const ticket = await prisma.ticketLog.findUnique({
                where: { ticket_id }
            });

            if (!ticket) {
                return await interaction.update({
                    content: `ไม่พบตั๋วที่มี ID: ${ticket_id}`,
                    components: [],
                    ephemeral: true
                });
            }

            // ดึงข้อความในตั๋ว
            const messages = await prisma.messageLog.findMany({
                where: { ticket_id },
                orderBy: { created_at: 'asc' },
                take: 10 // แสดงแค่ 10 ข้อความล่าสุด
            });

            // สร้าง Embed สำหรับแสดงข้อมูลตั๋ว
            const ticketEmbed = new EmbedBuilder()
                .setTitle(`ตั๋ว: ${ticket.title}`)
                .setDescription(ticket.description || "ไม่มีคำอธิบาย")
                .addFields(
                    { name: 'สถานะ', value: ticket.status === 'open' ? '🟢 เปิดอยู่' : '🔴 ปิดแล้ว', inline: true },
                    { name: 'ผู้สร้าง', value: `<@${ticket.created_by}>`, inline: true },
                    { name: 'สร้างเมื่อ', value: `<t:${Math.floor(ticket.created_at.getTime() / 1000)}:F>`, inline: true }
                )
                .setColor(ticket.status === 'open' ? 0x00FF00 : 0xFF0000);

            if (ticket.closed_at) {
                ticketEmbed.addFields({
                    name: 'ปิดเมื่อ',
                    value: `<t:${Math.floor(ticket.closed_at.getTime() / 1000)}:F>`,
                    inline: true
                });
            }

            // สร้าง Embeds สำหรับแสดงข้อความ
            const messageEmbeds = await Promise.all(messages.slice(0, 5).map(async msg => {
                const fetchedUser = await client.users.fetch(msg.user_id).catch(() => null);
                const avatarURL = fetchedUser ? fetchedUser.displayAvatarURL({ dynamic: true, size: 128 }) : null;

                return new EmbedBuilder()
                    .setAuthor({
                        name: msg.username,
                        iconURL: avatarURL || undefined
                    })
                    .setDescription(msg.content || "ไม่มีข้อความ")
                    .setFooter({ text: `ส่งเมื่อ ${new Date(msg.created_at).toLocaleString("th-TH")}` })
                    .setColor(0x0099FF);
            }));

            // สร้างปุ่มต่างๆ
            const components = [];

            // ปุ่มย้อนกลับไปหน้ารายการตั๋ว
            const backButton = new ButtonBuilder()
                .setCustomId('back-to-ticket-list')
                .setLabel('กลับไปหน้ารายการตั๋ว')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            // ถ้าตั๋วปิดแล้ว เพิ่มปุ่มเปิดอีกครั้ง
            if (ticket.status === 'closed') {
                const reopenButton = new ButtonBuilder()
                    .setCustomId(`reopen-ticket-${ticket_id}`)
                    .setLabel('เปิดตั๋วอีกครั้ง')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🔓');

                components.push(new ActionRowBuilder().addComponents(backButton, reopenButton));
            } else {
                components.push(new ActionRowBuilder().addComponents(backButton));
            }

            // ตอบกลับด้วยข้อมูลตั๋ว
            await interaction.update({
                content: null,
                embeds: [ticketEmbed, ...messageEmbeds],
                components: components,
                ephemeral: true
            });

        } catch (err) {
            console.error(`Error handling view-ticket: ${err}`);
            await interaction.update({
                content: `เกิดข้อผิดพลาดในการดึงข้อมูลตั๋ว: ${err.message}`,
                components: [],
                ephemeral: true
            });
        }
    }
}).toJSON(); 