const { ButtonInteraction } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const SQLite = require("../../client/handler/DatabaseHandler");
const { error, info } = require("../../utils/Console");

module.exports = new Component({
    customId: 'close-ticket',
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        const db = new SQLite()

        try {
            const channelName = interaction.channel.name

            const ticketId = await db.get(`
                SELECT ticket_id FROM ticket_logs WHERE ticket_id = ?
                `,
                [
                    channelName
                ]
            )

            if (!ticketId) return

            try {

                const messages = await interaction.channel.messages.fetch()

                for (const [id, message] of messages) {
                    await db.run(`
                        INSERT OR REPLACE INTO message_logs (
                            message_id, ticket_id, user_id, username, content, created_at
                            ) VALUES (?, ?, ?, ?, ?, ?)
                            `, [
                        message.id,
                        ticketId,
                        message.author.id,
                        message.author.username,
                        message.content || null,
                        message.createdAt.toISOString()
                    ]);
                }

                await interaction.channel.send('------------------- End -------------------')

                try {
                    info(`delete channel ${interaction.channel.name}`)
                    await interaction.channel.delete()
                } catch (err) {
                    error(`Fail to delete a channel.`)
                }
            } catch (err) {
                error(`Fail to save ticket data ${channelName} err: ${err}`)
            }

        } catch (err) {
            error(`Fail to get ticket id.`)
        }
    }
}).toJSON();