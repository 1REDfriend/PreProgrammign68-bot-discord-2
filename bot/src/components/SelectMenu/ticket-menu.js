const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { prisma } = require("../../utils/Database");

module.exports = new Component({
    customId: 'select-ticket',
    type: 'select',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {import("discord.js").AnySelectMenuInteraction} interaction 
     */
    run: async (client, interaction) => {

        const ticket_id = interaction.values[0];

        const data = await prisma.messageLog.findMany({
            where: { ticket_id },
            select: {
                message_id: true,
                user_id: true,
                username: true,
                content: true,
                created_at: true,
            }
        });

        if (data.length > 0) {
            const mappedData = data.map(entry => ({
                message_id: entry.message_id,
                user_id: entry.user_id,
                username: entry.username,
                content: entry.content,
                created_at: entry.created_at,
            }));

            await interaction.update({
                content: `Found ${data.length} message(s) for ticket ID: ${ticket_id}`,
                embeds: await Promise.all(mappedData.map(async msg => {
                    const fetchedUser = await client.users.fetch(msg.user_id).catch(() => null);
                    const avatarURL = fetchedUser ? fetchedUser.displayAvatarURL({ dynamic: true, size: 128 }) : null;

                    return {
                        thumbnail: avatarURL ? { url: avatarURL } : undefined,
                        title: `Content: ${msg.content}`,
                        description: `User: <@${msg.username}> (${msg.user_id})\nMessage ID: ${msg.message_id}\nCreated At: ${msg.created_at}`,
                        color: 0x64ff64,
                    };
                })),
                components: [],
                flags: 64
            });
        } else {
            await interaction.update({
                content: `No messages found for ticket ID: ${ticket_id}`,
                components: [],
                flags: 64
            });
        }

    }
}).toJSON();