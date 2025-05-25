const { TextChannel, EmbedBuilder, ActionRowBuilder, ButtonStyle, Colors, ButtonBuilder } = require("discord.js");
const DiscordBot = require("../DiscordBot");
const { prisma } = require("../../utils/Database");
const { info, error } = require("../../utils/Console");

class TicketExpireTracker {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
        this.interval = 1000 * 60 * 1;
        this.checkInterval = null;
        this.isRunning = false;

        this.client.on("ready", () => {
            this.checkInterval = setInterval(async () => {
                if (!this.isRunning) {
                    this.isRunning = true;
                    try {
                        await this.start();
                    } catch (err) {
                        error(`Error in ticket expiry check: ${err}`);
                    } finally {
                        this.isRunning = false;
                    }
                }
            }, this.interval);

            info("TicketExpireTracker started");
        });

        this.client.on("shutdown", this.cleanup.bind(this));
    }

    cleanup() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            info("TicketExpireTracker stopped");
        }
    }

    async start() {
        const tickets = await prisma.ticket.findMany();
        const ticketLogs = await prisma.ticketLog.findMany({
            where: {
                expire_in: {
                    gt: Date.now() - 1000 * 60 * 60 * 24 * 10
                },
                closed_at: null
            }
        });

        for (const ticket of tickets) {
            const ticketLog = ticketLogs.filter(log => log.guild_id === ticket.guild_id);
            for (const log of ticketLog) {
                if (log) {
                    // ตรวจสอบว่าตั๋วมีการตั้งค่าหมดอายุหรือไม่
                    if (ticket.expire_time && log.expire_in < Date.now()) {
                        try {
                            const channel = this.client.channels.cache.get(log.channel_id);

                            /**
                             * @param {TextChannel} channel
                             */
                            if (channel) {
                                const messages = await channel.messages.fetch();

                                const messageLogs = messages.map(message => ({
                                    message_id: message.id,
                                    ticket_id: log.ticket_id,
                                    user_id: message.author.id,
                                    username: message.author.username,
                                    content: message.content || null,
                                    created_at: message.createdAt.toISOString(),
                                }));

                                await prisma.messageLog.createMany({
                                    data: messageLogs,
                                    skipDuplicates: true,
                                });

                                // อัปเดตสถานะตั๋วเป็นปิด และบันทึกวันที่ปิด
                                await prisma.ticketLog.update({
                                    where: {
                                        ticket_id: log.ticket_id
                                    },
                                    data: {
                                        status: 'closed',
                                        closed_at: new Date()
                                    }
                                });

                                await channel.send({
                                    content: `# ตั๋วถูกปิดโดย <@${this.client.user.id}>\nตั๋วนี้จะถูกลบในอีกไม่กี่วินาที อย่ากังวล ข้อมูลทั้งหมดจะถูกบันทึกไว้\nคุณสามารถเปิดตั๋วนี้อีกครั้งได้ด้วยคำสั่ง \`/ticket find\``
                                });

                                await new Promise(resolve => setTimeout(resolve, 5000));

                                try {
                                    info(`delete channel ${channel.name} by expire time`);
                                    await channel.delete();
                                } catch (err) {
                                    error(`Fail to delete a channel ${channel.name} by expire time.`);
                                }
                            }
                        } catch (err) {
                            error(`Fail to delete a channel by expire time err: ${err}`);
                        }
                    } else if (ticket.expire_time && log.expire_in < Date.now() + 1000 * 60 * 60 * 3) {
                        if (!log.warn_expire) {
                            await prisma.ticketLog.update({
                                where: {
                                    ticket_id: log.ticket_id
                                },
                                data: {
                                    warn_expire: true
                                }
                            });

                            const channel = this.client.channels.cache.get(log.channel_id);

                            /**
                             * @param {TextChannel} channel
                             */
                            if (channel) {
                                const askTicketEmbed = new EmbedBuilder()
                                    .setColor(Colors.Orange)
                                    .setDescription("ตั๋วจะหมดอายุในไม่กี่ชั่วโมง อย่ากังวล ข้อมูลทั้งหมดจะถูกบันทึกไว้")

                                const askTicketRow = new ActionRowBuilder().addComponents(
                                    new ButtonBuilder().setCustomId("close-ticket").setLabel("ปิดตั๋วตอนนี้").setStyle(ButtonStyle.Danger),
                                    new ButtonBuilder().setCustomId("cancel-ticket").setLabel("ยังไม่ปิด").setStyle(ButtonStyle.Secondary)
                                );

                                await channel.send({ embeds: [askTicketEmbed], components: [askTicketRow] });
                            } else {
                                error(`Fail to get a channel ${ticket.channel_id} by warn expire time.`);
                            }
                        }
                    }
                }
            }
        }
    }
}

module.exports = TicketExpireTracker;
