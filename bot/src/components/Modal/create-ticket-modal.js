const { ModalSubmitInteraction, EmbedBuilder, ButtonStyle, PermissionsBitField, ButtonBuilder, ActionRowBuilder } = require("discord.js")
const DiscordBot = require("../../client/DiscordBot")
const Component = require("../../structure/Component")
const { error, info } = require("../../utils/Console")
const { prisma } = require("../../utils/Database")

/**
 * @param {DiscordBot} client
 * @param {import("discord.js").Interaction} interaction
 */
module.exports = new Component({
    customId: 'create_ticket',
    type: 'modal',
    run: async (client, interaction) => {
        const title = interaction.fields.getTextInputValue('create_ticket-field-1')
        const description = interaction.fields.getTextInputValue('create_ticket-field-2')
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { guild_id: interaction.guildId },
            })
            if (!ticket) return interaction.reply({ content: "Ticket configuration not found.", ephemeral: true })
            const { category_id, role_id: staffRole, notification_channel_id, notification_role_id } = ticket
            const channel = await interaction.guild.channels.create({
                name: `ticket-${Date.now()}`,
                type: 0,
                parent: category_id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.roles.everyone.id, deny: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: staffRole, allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ManageMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                    {
                        id: interaction.user.id, allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ]
                    },
                ],
            })
            try {
                await prisma.ticketLog.create({
                    data: {
                        ticket_id: channel.name,
                        title,
                        description,
                        user_id: interaction.user.id,
                        created_by: interaction.user.displayName,
                        channel_id: channel.id,
                        status: 'OPEN',
                        created_at: new Date(),
                        guild_id: interaction.guildId
                    },
                })
                const e = new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL() })
                    .setFooter({ text: `ชื่อผู้ใช้: ${interaction.user.username}` })
                    .setTimestamp()
                const btn = new ButtonBuilder().setCustomId('close-ticket').setLabel('ปิดตั๋ว').setStyle(ButtonStyle.Danger)
                await channel.send({ embeds: [e], components: [new ActionRowBuilder().addComponents(btn)] })

                // ส่งการแจ้งเตือนไปยังช่องที่กำหนดถ้ามีการตั้งค่าไว้
                if (notification_channel_id) {
                    const notificationChannel = await interaction.guild.channels.fetch(notification_channel_id).catch(() => null)
                    if (notificationChannel) {
                        const notificationEmbed = new EmbedBuilder()
                            .setTitle('มีการสร้าง Ticket ใหม่')
                            .setColor(0x00AE86)
                            .setDescription(`**หัวข้อ:** ${title}\n**รายละเอียด:** ${description || 'ไม่มีรายละเอียด'}\n**ผู้สร้าง:** <@${interaction.user.id}>\n**ช่อง:** <#${channel.id}>`)
                            .setTimestamp()
                            .setFooter({ text: `Ticket ID: ${channel.name}` })

                        let content = ''
                        if (notification_role_id) {
                            content = `<@&${notification_role_id}> มี Ticket ใหม่ที่ต้องการการดูแล!`
                        }

                        await notificationChannel.send({
                            content: content,
                            embeds: [notificationEmbed]
                        }).catch(err => {
                            error(`Failed to send notification: ${err.message}`)
                        })
                    }
                }

                await interaction.reply({ content: `ตั๋วของคุณได้ถูกสร้างเรียบร้อย: <#${channel.id}>`, flags: 64 })
                info(`${interaction.guild.name} user: ${interaction.user.displayName} created a ticket => ${channel}`)
            } catch (err) {
                await channel.delete()
                error(`Failed to create a ticket in ${interaction.guild.name}: ${err.message}`)
            }
        } catch (err) {
            error('Error fetching ticket configuration:', err.message)
            await interaction.reply({ content: "เกิดข้อผิดพลาดในการสร้างตั๋ว", ephemeral: true })
        } finally {
            await prisma.$disconnect()
        }
    }
}).toJSON()
