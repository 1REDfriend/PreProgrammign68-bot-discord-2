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
            if (!message?.author || message.author.bot || message.channel.type === ChannelType.DM) return;

            try {
                if (!message.guild?.id) return;

                await prisma.userLog.create({
                    data: {
                        user_id: message.author.id,
                        username: message.author.username,
                        action: "message_create",
                        server_id: message.guild.id,
                        channel_id: message.channel?.id || "unknown",
                        message_content: message.content || ""
                    }
                });
            } catch (err) {
                error("Error saving message log:", err.message);
            }
        });

        // ตรวจจับการเปลี่ยนสถานะออนไลน์
        client.on("presenceUpdate", async (oldPresence, newPresence) => {
            if (!newPresence?.user || newPresence.user.bot) return;

            try {
                const user = newPresence.user || oldPresence?.user;
                if (!user) return;

                const status = newPresence.status || "offline";

                // ตรวจสอบว่ามี guild หรือไม่ (อาจเป็น DM)
                if (!newPresence.guild?.id) return;

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
            if (!newState?.member?.user) return;
            const user = newState.member.user;
            if (user.bot) return;

            try {
                // เข้าช่องเสียง
                if (!oldState?.channel && newState?.channel) {
                    await prisma.userLog.create({
                        data: {
                            user_id: user.id,
                            username: user.username,
                            action: "join_voice_channel",
                            server_id: newState.guild?.id || "unknown",
                            channel_id: newState.channel.id
                        }
                    });
                }
                // ออกจากช่องเสียง
                else if (oldState?.channel && !newState?.channel) {
                    await prisma.userLog.create({
                        data: {
                            user_id: user.id,
                            username: user.username,
                            action: "leave_voice_channel",
                            server_id: oldState.guild?.id || "unknown",
                            channel_id: oldState.channel.id
                        }
                    });
                }
            } catch (err) {
                error("Error logging voice channel update:", err.message);
            }
        });

        // ตรวจจับการเข้า/ออกเซิร์ฟเวอร์
        client.on("guildMemberAdd", async (member) => {
            if (!member || !member.user) return;

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: member.id,
                        username: member.user.username,
                        action: "join_server",
                        server_id: member.guild?.id || "unknown"
                    }
                });
            } catch (err) {
                error("Error logging user join server:", err.message);
            }
        });

        client.on("guildMemberRemove", async (member) => {
            if (!member || !member.user) return;

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: member.id,
                        username: member.user.username,
                        action: "leave_server",
                        server_id: member.guild?.id || "unknown"
                    }
                });
            } catch (err) {
                error("Error logging user leave server:", err.message);
            }
        });

        client.on("messageReactionAdd", async (reaction, user) => {
            if (!user || user.bot) return;
            if (!reaction?.message?.guild) return; // ไม่บันทึกกรณีเป็น DM

            try {
                const emojiName = reaction.emoji.id
                    ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` // Custom emoji
                    : reaction.emoji.name; // Standard emoji

                await prisma.userLog.create({
                    data: {
                        user_id: user.id,
                        username: user.username,
                        action: "reaction_add",
                        server_id: reaction.message.guild.id,
                        channel_id: reaction.message.channel?.id || "unknown",
                        message_content: reaction.message.content || "",
                        status: emojiName || "unknown_emoji"
                    }
                });
            } catch (err) {
                error("Error logging reaction add:", err.message);
            }
        });

        // ติดตามการลบ reaction
        client.on("messageReactionRemove", async (reaction, user) => {
            if (!user || user.bot) return;
            if (!reaction?.message?.guild) return; // ไม่บันทึกกรณีเป็น DM

            try {
                const emojiName = reaction.emoji.id
                    ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` // Custom emoji
                    : reaction.emoji.name; // Standard emoji

                await prisma.userLog.create({
                    data: {
                        user_id: user.id,
                        username: user.username,
                        action: "reaction_remove",
                        server_id: reaction.message.guild.id,
                        channel_id: reaction.message.channel?.id || "unknown",
                        message_content: reaction.message.content || "",
                        status: emojiName || "unknown_emoji"
                    }
                });
            } catch (err) {
                error("Error logging reaction remove:", err.message);
            }
        });

        // ติดตามการแก้ไขข้อความ
        client.on("messageUpdate", async (oldMessage, newMessage) => {
            if (!oldMessage?.author || oldMessage.author.bot) return;
            if (!oldMessage.guild) return; // ไม่บันทึกกรณีเป็น DM

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: oldMessage.author.id,
                        username: oldMessage.author.username,
                        action: "message_update",
                        server_id: oldMessage.guild.id,
                        channel_id: oldMessage.channel?.id || "unknown",
                        message_content: newMessage.content || ""
                    }
                });
            } catch (err) {
                error("Error logging message update:", err.message);
            }
        });

        // ติดตามการลบข้อความ
        client.on("messageDelete", async (message) => {
            if (!message?.author || message.author.bot) return;
            if (!message.guild) return; // ไม่บันทึกกรณีเป็น DM

            try {
                await prisma.userLog.create({
                    data: {
                        user_id: message.author.id,
                        username: message.author.username,
                        action: "message_delete",
                        server_id: message.guild.id,
                        channel_id: message.channel?.id || "unknown",
                        message_content: message.content || ""
                    }
                });
            } catch (err) {
                error("Error logging message delete:", err.message);
            }
        });
    }
}

module.exports = TrackUserListener;
