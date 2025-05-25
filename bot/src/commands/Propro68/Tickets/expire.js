const { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { prisma } = require("../../../utils/Database");

/** 
 * 
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function expireTicket(client, interaction, expireTime) {
    expireTime = expireTime * 1000 * 60;

    const ticket = await prisma.ticket.findUnique({
        where: {
            guild_id: interaction.guild.id
        }
    });

    if (!ticket) return interaction.reply({
        content: "ไม่พบข้อมูลตั๋วในเซิพเวอร์นี้",
        ephemeral: true
    });

    if (expireTime > Number.MAX_VALUE) return interaction.reply({
        content: "เวลาที่กำหนดมีค่ามากเกินไป",
        ephemeral: true
    });

    const updateTicket = await prisma.ticket.update({
        where: {
            guild_id: interaction.guild.id
        },
        data: {
            expire_time: expireTime || 0
        }
    });

    if (!updateTicket) return interaction.reply({
        content: "ไม่สามารถอัพเดตข้อมูลตั๋วได้",
        ephemeral: true
    });

    if (expireTime < 1000 * 60 * 1 && expireTime !== 0) {
        return interaction.reply({
            content: "เวลาที่กำหนดต้องมีค่ามากกว่า 1 นาที",
            ephemeral: true
        });
    }

    // หาตั๋วที่ยังไม่กำหนดเวลาหมดอายุ
    const ticketLogs = await prisma.ticketLog.findMany({
        where: {
            guild_id: interaction.guild.id,
            expire_in: null
        }
    });

    for (const log of ticketLogs) {
        await prisma.ticketLog.update({
            where: {
                ticket_id: log.ticket_id
            },
            data: {
                expire_in: Date.now() + expireTime
            }
        });
    }

    return interaction.reply({
        content: `เวลาที่กำหนดตั๋วเป็น ${expireTime / 1000} วินาที`,
        ephemeral: true
    });
}

module.exports = expireTicket;