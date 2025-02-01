const { ChatInputCommandInteraction, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()
/**
 * Subcommand handler for ticket find
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    // ตัวอย่างการค้นหา Ticket
    const ticketId = interaction.options.getString('ticket_id');
    const user = interaction.options.getUser('who');

    if (ticketId) {
        const data = await prisma.ticketLog.findMany({
            select: {
                ticket_id: ticketId
            }
        })

        if (data.length > 0) {
            const mappedData = data.map(entry => ({
                message_id: entry.message_id,
                user_id: entry.user_id,
                username: entry.username,
                content: entry.content,
                created_at: entry.created_at,
            }));

            await interaction.reply({
                content: `Found ${data.length} message(s) for ticket ID: ${ticketId}`,
                embeds: await Promise.all(mappedData.map(async msg => {
                    const fetchedUser = await client.users.fetch(msg.user_id).catch(() => null);
                    const avatarURL = fetchedUser ? fetchedUser.displayAvatarURL({ dynamic: true, size: 128 }) : null;

                    return {
                        thumbnail: avatarURL ? { url: avatarURL } : undefined,
                        title: `Message ID: ${msg.message_id}`,
                        description: `User: <@${msg.username}> (${msg.user_id})\nContent: ${msg.content}\nCreated At: ${msg.created_at}`,
                        color: 0x64ff64,
                    };
                })),
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `No messages found for ticket ID: ${ticketId}`,
                flags: 64
            });
        }
    } else if (user) {
        const data = await prisma.messageLog.findMany({
            select: {
                user_id: user.id
            }
        })

        if (data.length > 0) {
            const mappedData = data.map(entry => ({
                message_id: entry.message_id,
                user_id: entry.user_id,
                ticket_id: entry.ticket_id,
                content: entry.content,
                created_at: entry.created_at,
            }));

            await interaction.reply({
                content: `Found ${data.length} message(s) for user ID: <@${user.id}>`,
                embeds: await Promise.all(mappedData.map(async msg => {

                    const fetchedUser = await client.users.fetch(msg.user_id).catch(() => null);
                    const avatarURL = fetchedUser ? fetchedUser.displayAvatarURL({ dynamic: true, size: 128 }) : null;

                    return {
                        thumbnail: avatarURL ? { url: avatarURL } : undefined,
                        title: `Message ID: ${msg.message_id}`,
                        description: `Ticket ID: ${msg.ticket_id}\nContent: ${msg.content}\nCreated At: ${msg.created_at}`,
                        color: 0x64ff64,
                    };
                })),
                flags: 64
            });
        } else {
            await interaction.reply({
                content: `No messages found for user ID: <@${user.id}>`,
                flags: 64
            });
        }
    } else {
        const data = await prisma.ticketLog.findMany({
            where: { guild_id: interaction.guildId },
            distinct: ['ticket_id', 'user_id'],
            select: { ticket_id: true, user_id: true }
        })

        if (data.length > 0) {
            const ticketOptions = await Promise.all(data.map(async entry => {
                const fetchedUser = await client.users.fetch(entry.user_id).catch(() => null);
                const username = fetchedUser ? fetchedUser.username : 'Unknown User';

                const date = new Date(parseInt(entry.ticket_id.slice(7, -1)) * 1000);
                const formattedDate = date.toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                });

                return {
                    label: `Ticket ID: ${formattedDate} (User: ${username})`,
                    value: entry.ticket_id,
                };
            }));

            const embed = new EmbedBuilder()
                .setTitle("Available Tickets")
                .setDescription("Chose a Ticket ID from below:")
                .setColor("Blue");

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('select-ticket')
                .setPlaceholder('Select a ticket ID')
                .addOptions(ticketOptions);

            const actionRow = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.reply({
                embeds: [embed],
                components: [actionRow],
                flags: 64
            });
        } else {
            await interaction.reply({
                content: "No tickets found in the database for this server.",
                flags: 64
            });
        }
    }
};
