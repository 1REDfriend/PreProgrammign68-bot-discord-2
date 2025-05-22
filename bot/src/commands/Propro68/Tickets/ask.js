const { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { prisma } = require("../../../utils/Database");

const ticketPattern = new RegExp(`^ticket-\\d{13,}`, 'i');

/**
 * 
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function askCloseHandler(client, interaction) {
    if (!ticketPattern.test(interaction.channel.name)) return interaction.reply({
        content: "กรุณาใช้คำสั่งนี้ในช่องที่มีการสร้างตั๋ว",
        ephemeral: true
    });

    const ticket = await prisma.ticketLog.findUnique({
        where: {
            ticket_id: interaction.channel.name
        }
    });

    if (!ticket) return interaction.reply({
        content: "ไม่พบข้อมูลตั๋วในช่องนี้",
        ephemeral: true
    });

    const askTicketEmbed = new EmbedBuilder()
        .setColor("Blue")
        .setDescription(`<@${ticket.user_id}> คุณต้องการปิดตั๋วเลยหรือไม่`)
        .setTimestamp();

    const askTicketRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("close-ticket").setLabel("ปิดตั๋ว").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancel-ticket").setLabel("ยกเลิก").setStyle(ButtonStyle.Secondary)
    );
    await interaction.reply({ embeds: [askTicketEmbed], components: [askTicketRow] });
}

module.exports = askCloseHandler;
