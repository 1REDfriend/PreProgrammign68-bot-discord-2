const { ButtonInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { error, info } = require("../../utils/Console");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

module.exports = new Component({
    customId: 'close-ticket',
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            const channelName = interaction.channel.name;

            const ticketLog = await prisma.ticketLog.findUnique({
                where: {
                    ticket_id: channelName,
                },
            });

            if (!ticketLog) return;

            try {
                const messages = await interaction.channel.messages.fetch();

                const messageLogs = messages.map(message => ({
                    message_id: message.id,
                    ticket_id: ticketLog.ticket_id,
                    user_id: message.author.id,
                    username: message.author.username,
                    content: message.content || null,
                    created_at: message.createdAt.toISOString(),
                }));

                await prisma.messageLog.createMany({
                    data: messageLogs,
                    skipDuplicates: true,
                });

                await interaction.channel.send('------------------- End -------------------');

                try {
                    info(`delete channel ${interaction.channel.name}`);
                    await interaction.channel.delete();
                } catch (err) {
                    error(`Fail to delete a channel.`);
                }
            } catch (err) {
                error(`Fail to save ticket data ${channelName} err: ${err}`);
            }

        } catch (err) {
            error(`Fail to get ticket id.`);
        }
    }
}).toJSON();