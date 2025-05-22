const { VoiceState } = require("discord.js");
const { prisma } = require("../../utils/Database");
const DiscordBot = require("../../client/DiscordBot");
const { info, error } = require("../../utils/Console");
const Event = require("../../structure/Event");


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
        // ตรวจสอบเฉพาะกรณีที่ผู้ใช้ออกจากห้องเสียง
        if (oldState.channelId && (!newState.channelId || oldState.channelId !== newState.channelId)) {
            try {
                // ตรวจสอบว่าห้องที่ออกเป็นห้องส่วนตัวหรือไม่
                const privateRoom = await prisma.privateRoomChannel.findFirst({
                    where: {
                        channel_id: oldState.channelId,
                        deleted_at: null
                    }
                });

                // ถ้าเป็นห้องส่วนตัว
                if (privateRoom) {
                    // ตรวจสอบว่ามีผู้ใช้เหลืออยู่ในห้องหรือไม่
                    const channel = oldState.channel;
                    
                    // ถ้าไม่มีห้องหรือห้องว่างเปล่า
                    if (!channel || channel.members.size === 0) {
                        // อัปเดตฐานข้อมูลเพื่อทำเครื่องหมายว่าห้องถูกลบแล้ว
                        await prisma.privateRoomChannel.update({
                            where: {
                                channel_id: oldState.channelId
                            },
                            data: {
                                deleted_at: new Date()
                            }
                        });

                        // ลบห้องจาก Discord
                        await channel.delete(`ห้องส่วนตัวถูกลบเนื่องจากไม่มีผู้ใช้อยู่ในห้อง`);
                        
                        info(`ห้องส่วนตัว ${privateRoom.name} (${oldState.channelId}) ถูกลบเพราะไม่มีผู้ใช้`);
                    }
                }
            } catch (err) {
                error(`[PrivateRoom] เกิดข้อผิดพลาด: ${err.message}`);
            } finally {
                await prisma.$disconnect();
            }
        }
    }
}).toJSON(); 