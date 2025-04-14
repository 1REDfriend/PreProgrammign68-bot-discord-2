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

        // Set up client for voice state listener if not already set up
        if (!client.autoCreateRoomSetup) {
            client.autoCreateRoomSetup = true;
            setupVoiceStateListener(client);
        }

        // Create success embed
        const successEmbed = new EmbedBuilder()
            .setTitle('✅ ตั้งค่าสำเร็จ')
            .setDescription(`ได้ตั้งค่าระบบสร้างห้องอัตโนมัติเรียบร้อยแล้ว
ช่องรอ: ${waitChannel}
หมวดหมู่: ${createCategory}`)
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

/**
 * Setup voice state listener for auto room creation
 * @param {DiscordBot} client 
 */
function setupVoiceStateListener(client) {
    client.on('voiceStateUpdate', async (oldState, newState) => {
        try {
            // If user is not a bot and joined a new channel
            if (newState.member.user.bot) return;
            
            if (!oldState.channel && newState.channel) {
                // User joined a voice channel
                const guildSetup = await prisma.autoCreateRoom.findUnique({
                    where: {
                        guild_id: newState.guild.id
                    }
                });

                if (!guildSetup) return; // No setup for this guild
                
                // Check if the channel is the wait channel
                if (newState.channel.id === guildSetup.wait_channel_id) {
                    // Create a new voice channel for the user
                    const username = newState.member.displayName || newState.member.user.username;
                    const newChannel = await newState.guild.channels.create({
                        name: `🔊 ${username}`,
                        type: ChannelType.GuildVoice,
                        parent: guildSetup.create_category_id,
                        permissionOverwrites: [
                            {
                                id: newState.member.id,
                                allow: ['ManageChannels', 'Connect', 'Speak', 'Stream', 'UseVAD']
                            }
                        ]
                    });
                    
                    // Move user to the new channel
                    await newState.member.voice.setChannel(newChannel);
                }
            } else if (oldState.channel && (!newState.channel || newState.channel.id !== oldState.channel.id)) {
                // User left a voice channel or switched channels
                
                // Check if the old channel is empty and not the wait channel
                const guildSetup = await prisma.autoCreateRoom.findUnique({
                    where: {
                        guild_id: oldState.guild.id
                    }
                });
                
                if (!guildSetup) return; // No setup for this guild
                
                // Don't delete the wait channel
                if (oldState.channel.id === guildSetup.wait_channel_id) return;
                
                // Check if channel is in the correct category and empty
                if (oldState.channel.parentId === guildSetup.create_category_id && 
                    oldState.channel.members.size === 0) {
                    // Delete the empty channel
                    await oldState.channel.delete();
                }
            }
        } catch (error) {
            console.error('Error in voice state listener:', error);
        }
    });
}

module.exports = { setupAutoCreateRoom }; 