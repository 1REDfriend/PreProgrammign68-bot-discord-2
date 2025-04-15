const { ChatInputCommandInteraction, ChannelType, EmbedBuilder } = require("discord.js");
const { PrismaClient } = require('@prisma/client');
const DiscordBot = require("../../../client/DiscordBot");

const prisma = new PrismaClient();

/**
 * Setup auto create room functionality
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
async function setupAutoCreateRoom(client, interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const waitChannel = interaction.options.getChannel('channel');
        const createCategory = interaction.options.getChannel('create_on');

        // Validate channels
        if (waitChannel.type !== ChannelType.GuildVoice) {
            return interaction.editReply({
                content: 'ช่องรอต้องเป็นช่องเสียงเท่านั้น',
                ephemeral: true
            });
        }

        if (createCategory.type !== ChannelType.GuildCategory) {
            return interaction.editReply({
                content: 'หมวดหมู่ที่จะสร้างห้องต้องเป็นหมวดหมู่เท่านั้น',
                ephemeral: true
            });
        }

        // Check if setup already exists for this guild
        const existingSetup = await prisma.autoCreateRoom.findUnique({
            where: {
                guild_id: interaction.guild.id
            }
        });

        if (existingSetup) {
            // Update existing setup
            await prisma.autoCreateRoom.update({
                where: {
                    guild_id: interaction.guild.id
                },
                data: {
                    wait_channel_id: waitChannel.id,
                    create_category_id: createCategory.id,
                    updated_at: new Date()
                }
            });
        } else {
            // Create new setup
            await prisma.autoCreateRoom.create({
                data: {
                    guild_id: interaction.guild.id,
                    wait_channel_id: waitChannel.id,
                    create_category_id: createCategory.id
                }
            });
        }

        // Create success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ ตั้งค่าสำเร็จ')
            .setDescription(`ได้ตั้งค่าระบบสร้างห้องอัตโนมัติเรียบร้อยแล้ว
ช่องรอ: ${waitChannel}
หมวดหมู่: ${createCategory}

ระบบจะเริ่มทำงานทันที ผู้ใช้ที่เข้ามาในช่องรอจะถูกย้ายไปยังห้องที่สร้างใหม่โดยอัตโนมัติ`)
            .setColor('#00FF00')
            .setTimestamp();

        return interaction.editReply({
            embeds: [successEmbed],
            ephemeral: true
        });

    } catch (error) {
        console.error('Error setting up auto create room:', error);

        return interaction.editReply({
            content: `เกิดข้อผิดพลาด: ${error.message}`,
            ephemeral: true
        });
    }
}

module.exports = { setupAutoCreateRoom }; 