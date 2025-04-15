const { ModalSubmitInteraction, PermissionsBitField, ChannelType } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { error, info } = require("../../utils/Console");

const prisma = new PrismaClient();

module.exports = new Component({
    customId: 'create_private_room_role_modal',
    type: 'modal',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ModalSubmitInteraction} interaction 
     */
    run: async (client, interaction) => {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Get values from the modal
            const roomName = interaction.fields.getTextInputValue('room_name');
            const roomDescription = interaction.fields.getTextInputValue('room_description') || '';

            // Get server configuration
            const config = await prisma.privateRoom.findUnique({
                where: { guild_id: interaction.guildId }
            });

            if (!config) {
                return await interaction.editReply({
                    content: "ระบบห้องส่วนตัวยังไม่ได้ตั้งค่า โปรดติดต่อผู้ดูแล",
                    ephemeral: true
                });
            }

            // ใช้ role ที่ตั้งค่าไว้แล้วจาก setup
            let role;
            try {
                role = await interaction.guild.roles.fetch(config.role_id);
                if (!role) {
                    return await interaction.editReply({
                        content: "ไม่พบบทบาทที่ตั้งค่าไว้ โปรดติดต่อผู้ดูแล",
                        ephemeral: true
                    });
                }
            } catch (err) {
                return await interaction.editReply({
                    content: "เกิดข้อผิดพลาดในการเรียกบทบาท โปรดติดต่อผู้ดูแล",
                    ephemeral: true
                });
            }

            // Create permission overwrites
            const permissionOverwrites = [
                // Deny everyone access by default
                {
                    id: interaction.guild.roles.everyone.id,
                    deny: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect
                    ]
                },
                // Allow configured admin role access
                {
                    id: config.role_id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak
                    ]
                },
                // Allow the creator access
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak
                    ]
                }
            ];

            // Create the voice channel
            const voiceChannel = await interaction.guild.channels.create({
                name: roomName,
                type: ChannelType.GuildVoice,
                parent: config.category_id,
                permissionOverwrites: permissionOverwrites,
                reason: `ห้องส่วนตัวสร้างโดย ${interaction.user.tag}`
            });

            // Record in database
            await prisma.privateRoomChannel.create({
                data: {
                    channel_id: voiceChannel.id,
                    guild_id: interaction.guildId,
                    created_by: interaction.user.id,
                    name: roomName,
                    description: roomDescription,
                    type: 'ROLE',
                    role_id: role.id
                }
            });

            await interaction.editReply({
                content: `สร้างห้องส่วนตัวสำเร็จ! <#${voiceChannel.id}>`,
                ephemeral: true
            });

            info(`${interaction.guild.name}: ห้องส่วนตัวสร้างโดย ${interaction.user.tag}`);
        } catch (err) {
            error(`เกิดข้อผิดพลาดในการสร้างห้องส่วนตัว: ${err.message}`);
            await interaction.editReply({
                content: `สร้างห้องส่วนตัวไม่สำเร็จ: ${err.message}`,
                ephemeral: true
            });
        } finally {
            await prisma.$disconnect();
        }
    }
}).toJSON(); 