const { VoiceState, ChannelType } = require("discord.js");
const { PrismaClient } = require("@prisma/client");
const DiscordBot = require("../../client/DiscordBot");
const { info, error } = require("../../utils/Console");
const Event = require("../../structure/Event");

const prisma = new PrismaClient();

module.exports = new Event({
    event: "voiceStateUpdate",
    once: false,
    /**
     * 
     * @param {DiscordBot} client 
     * @param {VoiceState} oldState 
     * @param {VoiceState} newState 
     */
    run: async (client, oldState, newState) => {
        try {
            // ส่วนที่ 1: เมื่อผู้ใช้เข้าห้องรอ - สร้างห้องอัตโนมัติ
            if (newState.channelId && (!oldState.channelId || oldState.channelId !== newState.channelId)) {
                // ตรวจสอบว่าห้องที่เข้าเป็นห้องรอสำหรับสร้างห้องเสียงหรือไม่
                const autoCreateConfig = await prisma.autoCreateRoom.findFirst({
                    where: {
                        wait_channel_id: newState.channelId
                    }
                });

                // ถ้าเป็นห้องรอ
                if (autoCreateConfig) {
                    // สร้างชื่อห้องใหม่
                    const username = newState.member.user.displayName;
                    const channelName = `🔊 ${username}'s Room`;

                    // สร้างห้องเสียง
                    const newChannel = await newState.guild.channels.create({
                        name: channelName,
                        type: ChannelType.GuildVoice,
                        parent: autoCreateConfig.create_category_id,
                        reason: `Auto-created voice channel for ${username}`
                    });

                    // ย้ายผู้ใช้ไปยังห้องใหม่
                    await newState.member.voice.setChannel(newChannel);

                    info(`สร้างห้องเสียงอัตโนมัติ "${channelName}" (${newChannel.id}) สำหรับ ${username}`);
                }
            }

            // ส่วนที่ 2: เมื่อผู้ใช้ออกจากห้อง - ลบห้องอัตโนมัติที่ว่าง
            if (oldState.channelId && (!newState.channelId || oldState.channelId !== newState.channelId)) {
                const autoCreateConfig = await prisma.autoCreateRoom.findFirst({
                    where: {
                        guild_id: oldState.guild.id
                    }
                });

                // ตรวจสอบว่ามีการตั้งค่า auto-create และห้องที่ออกไม่ใช่ห้องรอ
                if (autoCreateConfig && oldState.channelId !== autoCreateConfig.wait_channel_id) {
                    const channel = oldState.channel;

                    // ตรวจสอบว่าห้องว่างหรือไม่
                    if (channel && channel.members.size === 0) {
                        // ตรวจสอบว่าห้องอยู่ในหมวดหมู่ที่ตั้งค่าไว้หรือไม่
                        if (channel.parentId === autoCreateConfig.create_category_id) {
                            // ตรวจสอบว่าเป็นห้องที่สร้างอัตโนมัติจากรูปแบบชื่อห้อง
                            const isAutoCreatedRoom = channel.name.startsWith('🔊') && channel.name.includes("'s Room");
                            
                            if (isAutoCreatedRoom) {
                                // ลบห้อง
                                await channel.delete(`ลบห้องเสียงอัตโนมัติเพราะไม่มีผู้ใช้`);
                                info(`ลบห้องเสียงอัตโนมัติ ${channel.name} (${channel.id}) เพราะไม่มีผู้ใช้`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            error(`[AutoRoom] เกิดข้อผิดพลาด: ${err.message}`);
        } finally {
            await prisma.$disconnect();
        }
    }
}).toJSON(); 