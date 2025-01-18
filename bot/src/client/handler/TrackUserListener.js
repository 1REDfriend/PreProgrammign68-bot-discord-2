const { ChannelType } = require("discord.js");
const { error } = require("../../utils/Console");
const DiscordBot = require("../DiscordBot");
const SQLite = require("./DatabaseHandler");

const db = new SQLite()

class TrackUserListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;

        // ตรวจจับข้อความที่สร้างขึ้น
        client.on("messageCreate", (message) => {
            if (message.author.bot || message.channel.type === ChannelType.DM) return;

            db.run(
                `INSERT INTO user_logs (user_id, username, action, server_id, channel_id, message_content) VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    message.author.id,
                    message.author.username,
                    "message_create",
                    message.guild.id,
                    message.channel.id,
                    message.content
                ],
                (err) => {
                    if (err) {
                        error("Error saving message log:", err.message);
                    }
                }
            );
        });

        // ตรวจจับการเปลี่ยนสถานะออนไลน์
        client.on("presenceUpdate", (oldPresence, newPresence) => {
            const user = newPresence.user || oldPresence.user;
            const status = newPresence.status || "offline";

            db.run(
                `INSERT INTO user_logs (user_id, username, action, server_id, status) VALUES (?, ?, ?, ?, ?)`,
                [
                    user.id,
                    user.username,
                    "status_update",
                    newPresence.guild.id,
                    status
                ],
                (err) => {
                    if (err) {
                        error("Error saving presence update log:", err.message);
                    }
                }
            );
        });

        // ตรวจจับการเข้า/ออกช่องเสียง
        client.on("voiceStateUpdate", (oldState, newState) => {
            const user = newState.member.user;

            if (!oldState.channel && newState.channel) {
                // เข้าช่องเสียง
                db.run(
                    `INSERT INTO user_logs (user_id, username, action, server_id, channel_id) VALUES (?, ?, ?, ?, ?)`,
                    [
                        user.id,
                        user.username,
                        "join_voice_channel",
                        newState.guild.id,
                        newState.channel.id
                    ],
                    (err) => {
                        if (err) {
                            error("Error logging join voice channel:", err.message);
                        }
                    }
                );
            } else if (oldState.channel && !newState.channel) {
                // ออกจากช่องเสียง
                db.run(
                    `INSERT INTO user_logs (user_id, username, action, server_id, channel_id) VALUES (?, ?, ?, ?, ?)`,
                    [
                        user.id,
                        user.username,
                        "leave_voice_channel",
                        oldState.guild.id,
                        oldState.channel.id
                    ],
                    (err) => {
                        if (err) {
                            error("Error logging leave voice channel:", err.message);
                        }
                    }
                );
            }
        });

        // ตรวจจับการเข้า/ออกเซิร์ฟเวอร์
        client.on("guildMemberAdd", (member) => {
            db.run(
                `INSERT INTO user_logs (user_id, username, action, server_id) VALUES (?, ?, ?, ?)`,
                [
                    member.id,
                    member.user.username,
                    "join_server",
                    member.guild.id
                ],
                (err) => {
                    if (err) {
                        error("Error logging user join server:", err.message);
                    }
                }
            );
        });

        client.on("guildMemberRemove", (member) => {
            db.run(
                `INSERT INTO user_logs (user_id, username, action, server_id) VALUES (?, ?, ?, ?)`,
                [
                    member.id,
                    member.user.username,
                    "leave_server",
                    member.guild.id
                ],
                (err) => {
                    if (err) {
                        error("Error logging user leave server:", err.message);
                    }
                }
            );
        });
    }
}

module.exports = TrackUserListener;
