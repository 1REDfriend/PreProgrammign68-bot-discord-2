const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info } = require("../../../utils/Console");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

/**
 * Subcommand handler for ticket setup
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description') || "Click the button below to create a ticket.";
    const setChannel = interaction.options.getChannel('set_channel');
    const setCategory = interaction.options.getChannel('set_catagory');
    const setRole = interaction.options.getRole('set_role');

    if (!setChannel.isTextBased()) {
        return interaction.reply({
            content: "The channel for interaction must be a text-based channel.",
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00AE86);

    const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    try {
        // บันทึกข้อมูลลงในตาราง tickets ด้วย Prisma
        await prisma.ticket.upsert({
            where: { guild_id: interaction.guildId },
            update: {
                category_id: setCategory.id,
                role_id: setRole.id,
                channel_id: setChannel.id
            },
            create: {
                guild_id: interaction.guildId,
                category_id: setCategory.id,
                role_id: setRole.id,
                channel_id: setChannel.id
            }
        });

        // ส่งข้อความใน channel ที่ตั้งค่า
        await setChannel.send({ embeds: [embed], components: [actionRow] });

        await interaction.reply({
            content: `Ticket setup successfully in ${setChannel}.`,
            flags: 64
        });

        info(`Ticket setup saved by server ${interaction.guild.name} admin ${interaction.user.globalName}`);
    } catch (error) {
        console.error('Failed to setup ticket:', error.message);
        return interaction.reply({
            content: "An error occurred while setting up the ticket.",
            flags: 64
        });
    } finally {
        await prisma.$disconnect(); // ปิดการเชื่อมต่อ Prisma เมื่อทำงานเสร็จ
    }
};
