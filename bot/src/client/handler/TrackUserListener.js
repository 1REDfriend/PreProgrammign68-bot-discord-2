const { ChannelType } = require("discord.js");
const { error } = require("../../utils/Console");
const DiscordBot = require("../DiscordBot");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

class TrackUserListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;

        // ตรวจจับข้อความที่สร้างขึ้น
        client.on("messageCreate", async (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: message.author.id,
                        username: message.author.username,
                        action: "message_create",
                        server_id: message.guild.id,
                        channel_id: message.channel.id,
                        message_content: message.content
                    }
                });
            } catch (err) {
                error("Error saving message log:", err.message);
            }
        });

        // ตรวจจับการเปลี่ยนสถานะออนไลน์
        client.on("presenceUpdate", async (oldPresence, newPresence) => {
            const user = newPresence.user || oldPresence.user;
            const status = newPresence.status || "offline";

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: user.id,
                        username: user.username,
                        action: "status_update",
                        server_id: newPresence.guild.id,
                        status: status
                    }
                });
            } catch (err) {
                error("Error saving presence update log:", err.message);
            }
        });

        // ตรวจจับการเข้า/ออกช่องเสียง
        client.on("voiceStateUpdate", async (oldState, newState) => {
            const user = newState.member.user;

            if (!oldState.channel && newState.channel) {
                // เข้าช่องเสียง
                try {
                    await prisma.userLog.create({
                        data: {
                            user_id: user.id,
                            username: user.username,
                            action: "join_voice_channel",
                            server_id: newState.guild.id,
                            channel_id: newState.channel.id
                        }
                    });
                } catch (err) {
                    error("Error logging join voice channel:", err.message);
                }
            } else if (oldState.channel && !newState.channel) {
                // ออกจากช่องเสียง
                try {
                    await prisma.userLog.create({
                        data: {
                            user_id: user.id,
                            username: user.username,
                            action: "leave_voice_channel",
                            server_id: oldState.guild.id,
                            channel_id: oldState.channel.id
                        }
                    });
                } catch (err) {
                    error("Error logging leave voice channel:", err.message);
                }
            }
        });

        // ตรวจจับการเข้า/ออกเซิร์ฟเวอร์
        client.on("guildMemberAdd", async (member) => {
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: member.id,
                        username: member.user.username,
                        action: "join_server",
                        server_id: member.guild.id
                    }
                });
            } catch (err) {
                error("Error logging user join server:", err.message);
            }
        });

        client.on("guildMemberRemove", async (member) => {
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: member.id,
                        username: member.user.username,
                        action: "leave_server",
                        server_id: member.guild.id
                    }
                });
            } catch (err) {
                error("Error logging user leave server:", err.message);
            }
        });
        client.on("messageReactionAdd", async (reaction, user) => {
            if (user.bot) return;
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: user.id,
                        username: user.username,
                        action: "reaction_add",
                        server_id: reaction.message.guild.id,
                        channel_id: reaction.message.channel.id,
                        message_content: reaction.message.content,
                        status: reaction.emoji.name // สามารถบันทึกชื่อของ emoji
                    }
                });
            } catch (err) {
                error("Error logging reaction add:", err.message);
            }
        });

        // ติดตามการลบ reaction
        client.on("messageReactionRemove", async (reaction, user) => {
            if (user.bot) return;
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: user.id,
                        username: user.username,
                        action: "reaction_remove",
                        server_id: reaction.message.guild.id,
                        channel_id: reaction.message.channel.id,
                        message_content: reaction.message.content,
                        status: reaction.emoji.name
                    }
                });
            } catch (err) {
                error("Error logging reaction remove:", err.message);
            }
        });

        // ติดตามการแก้ไขข้อความ
        client.on("messageUpdate", async (oldMessage, newMessage) => {
            if (oldMessage.author.bot) return;
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: oldMessage.author.id,
                        username: oldMessage.author.username,
                        action: "message_update",
                        server_id: oldMessage.guild.id,
                        channel_id: oldMessage.channel.id,
                        message_content: newMessage.content // บันทึกข้อความที่ได้รับการแก้ไข
                    }
                });
            } catch (err) {
                error("Error logging message update:", err.message);
            }
        });

        // ติดตามการลบข้อความ
        client.on("messageDelete", async (message) => {
            if (message.author.bot) return;
            try {
                await prisma.userLog.create({
                    data: {
                        user_id: message.author.id,
                        username: message.author.username,
                        action: "message_delete",
                        server_id: message.guild.id,
                        channel_id: message.channel.id,
                        message_content: message.content // บันทึกข้อความที่ถูกลบ
                    }
                });
            } catch (err) {
                error("Error logging message delete:", err.message);
            }
        });
    }
}

module.exports = TrackUserListener;
