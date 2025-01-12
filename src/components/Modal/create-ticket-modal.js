const { ModalSubmitInteraction, EmbedBuilder, ButtonStyle, PermissionsBitField, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const SQLite = require("../../client/handler/DatabaseHandler");
const { error, info, warn } = require("../../utils/Console");

module.exports = new Component({
    customId: 'create_ticket',
    type: 'modal',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ModalSubmitInteraction} interaction 
     */
    run: async (client, interaction) => {
        const db = new SQLite()

        const title = interaction.fields.getTextInputValue('create_ticket-field-1');
        const description = interaction.fields.getTextInputValue('create_ticket-field-2');

        try {
            const ticket = await db.get(`
                SELECT * FROM tickets WHERE guild_id = ? LIMIT 1
            `, [interaction.guildId]);

            if (!ticket) {
                return
            }

            const category_id = ticket.category_id
            const staffRole = ticket.role_id

            const ticketId = Date.now()
            const channelName = `ticket-${ticketId}`;

            const channel = await interaction.guild.channels.create({
                name: channelName,
                type: 0,
                parent: category_id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id,
                        deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                    },
                    {
                        id: staffRole, // ให้ Role ของ Staff มองเห็นและจัดการ Ticket
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ManageMessages
                        ], // อนุญาตให้มองเห็น ส่งข้อความ และจัดการข้อความ
                    },
                    {
                        id: interaction.user.id, // ให้ผู้สร้าง Ticket มองเห็นและพูดคุย
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages
                        ], // อนุญาตให้มองเห็นและส่งข้อความ
                    },
                ],
            });

            try {

                await db.run(`
                    INSERT INTO ticket_logs (ticket_id, title ,description, user_id, created_by ,channel_id ,status, created_at, guild_id)
                    VALUES (?, ?, ?, ?, ?, ?, ? ,?, ?)
                    `,
                    [
                        channelName,
                        title,
                        description,
                        interaction.user.id,
                        interaction.user.displayName,
                        channel.id,
                        'OPEN',
                        Date.now(),
                        interaction.guildId
                    ]
                )

                const ticketEmbeds = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setAuthor({
                        name: interaction.user.displayName,
                        iconURL: interaction.user.avatarURL()
                    })
                    .setTimestamp()

                const closeButton = new ButtonBuilder()
                    .setCustomId('close-ticket')
                    .setLabel('Close Ticket')
                    .setStyle(ButtonStyle.Danger);

                const actionRow = new ActionRowBuilder().addComponents(closeButton);

                await channel.send({ embeds: [ticketEmbeds], components: [actionRow] })

                await interaction.reply({
                    content: `Your ticket has been created: <#${channel.id}>`,
                    flags: 64
                });

                info(`${interaction.guild.name} user: ${interaction.user.displayName} create a ticket now! => ${channel}`)
            } catch (err) {
                channel.delete()

                error(`Create a ticket on ${interaction.guild.name} becouse: ${err}`)
            }

        } catch (err) {
            error('Error fetching ticket:', error.message);
        }
    }
}).toJSON();