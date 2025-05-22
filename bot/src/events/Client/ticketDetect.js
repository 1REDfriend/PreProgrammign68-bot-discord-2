const { EmbedBuilder, Client, Message, ButtonStyle, ActionRowBuilder, ButtonBuilder, Events } = require("discord.js");
const { prisma } = require("../../utils/Database");
const Event = require("../../structure/Event");
const { info } = require("../../utils/Console");

// เพิ่ม Set เพื่อติดตามช่องที่กำลังรอการยืนยัน
const pendingConfirmations = new Set();

module.exports = new Event({
    event: Events.MessageCreate,
    once: false,
    /**
     * @param {Client} client
     * @param {Message} message
     */
    run: async (client, message) => {
        const closeTicket = ["ปิดตั๋ว", "ขอบคุณ", "thank", "ผ่านแล้ว"];
        const wordPattern = new RegExp(`${closeTicket.join('|')}`, 'i');

        const ticketPattern = new RegExp(`^ticket-\\d{13,}`, 'i');

        if (message.author.bot) return;
        if (!ticketPattern.test(message.channel.name)) return;

        info(`1[${message.guild.name}] ${message.author.username} กำลังถามปิดตั๋ว ${message.channel.name}`)

        const hasTicket = await prisma.ticket.findUnique({
            where: {
                guild_id: message.guild.id
            }
        });

        if (!hasTicket) return;

        if (wordPattern.test(message.content)) {
            info(`[${message.guild.name}] ${message.author.username} กำลังถามปิดตั๋ว ${message.channel.name}`)
            // ตรวจสอบว่าช่องนี้กำลังรอการยืนยันอยู่แล้วหรือไม่
            if (pendingConfirmations.has(message.channel.id)) return;

            // เพิ่มช่องลงใน Set
            pendingConfirmations.add(message.channel.id);

            // เพิ่มการดีเลย์ 5 วินาที (5000 มิลลิวินาที)
            setTimeout(async () => {
                const askTicketEmbed = new EmbedBuilder()
                    .setColor("Blue")
                    .setDescription("คุณต้องการปิดตั๋วเลยหรือไม่")
                    .setAuthor({ name: message.author.displayName, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                const askTicketRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("close-ticket").setLabel("ปิดตั๋ว").setStyle(ButtonStyle.Danger),
                    new ButtonBuilder().setCustomId("cancel-ticket").setLabel("ยกเลิก").setStyle(ButtonStyle.Secondary)
                );

                await message.channel.send({ embeds: [askTicketEmbed], components: [askTicketRow] });

                // ลบช่องออกจาก Set หลังจาก 30 วินาที
                setTimeout(() => {
                    pendingConfirmations.delete(message.channel.id);
                }, 30000);
            }, 5000);
        }
    }
}).toJSON();