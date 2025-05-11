const { ButtonInteraction, PermissionsBitField, ChannelType, ButtonStyle, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");
const { error, info } = require("../../utils/Console");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

module.exports = new Component({
    customId: /^reopen-ticket-(.+)$/,
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            await interaction.deferReply({ ephemeral: true });

            // ดึง ticket_id จาก customId ที่เป็นรูปแบบ reopen-ticket-<ticket_id>
            const ticketId = interaction.customId.split("-").slice(2).join("-");
            info(`กำลังพยายามเปิดตั๋ว ${ticketId} โดยผู้ใช้ ${interaction.user.tag}`);

            // ดึงข้อมูลตั๋วที่จะเปิดใหม่
            const ticketLog = await prisma.ticketLog.findUnique({
                where: {
                    ticket_id: ticketId,
                }
            }).catch(err => {
                error(`เกิดข้อผิดพลาดในการค้นหาตั๋ว: ${err.message}`);
                return null;
            });

            if (!ticketLog) {
                info(`ไม่พบตั๋ว ${ticketId} ในฐานข้อมูล`);
                return await interaction.editReply({
                    content: `ไม่พบตั๋วที่ต้องการเปิดใหม่ ID: ${ticketId}`,
                });
            }

            // ตรวจสอบว่าตั๋วปิดแล้วจริงๆ หรือไม่
            if (ticketLog.status !== 'closed') {
                info(`ตั๋ว ${ticketId} มีสถานะเป็น ${ticketLog.status}`);
                return await interaction.editReply({
                    content: "ตั๋วนี้ยังเปิดอยู่แล้ว",
                });
            }

            // ดึงข้อมูล Ticket สำหรับ guild นี้
            const ticketConfig = await prisma.ticket.findUnique({
                where: {
                    guild_id: interaction.guildId,
                }
            }).catch(err => {
                error(`เกิดข้อผิดพลาดในการค้นหาการตั้งค่าตั๋ว: ${err.message}`);
                return null;
            });

            if (!ticketConfig) {
                info(`ไม่พบการตั้งค่าตั๋วสำหรับเซิร์ฟเวอร์ ${interaction.guildId}`);
                return await interaction.editReply({
                    content: "ไม่พบการตั้งค่าตั๋วสำหรับเซิร์ฟเวอร์นี้",
                });
            }

            await interaction.editReply({
                content: "กำลังเปิดตั๋วใหม่...",
            });

            // สร้างช่องใหม่สำหรับตั๋ว
            const guild = interaction.guild;
            const category = await guild.channels.fetch(ticketConfig.category_id).catch(err => {
                error(`เกิดข้อผิดพลาดในการค้นหาหมวดหมู่: ${err.message}`);
                return null;
            });

            if (!category) {
                info(`ไม่พบหมวดหมู่ ${ticketConfig.category_id} สำหรับสร้างช่องตั๋ว`);
                return await interaction.editReply({
                    content: "ไม่พบหมวดหมู่สำหรับสร้างช่องตั๋ว โปรดติดต่อแอดมิน",
                });
            }

            try {
                // สร้างช่องใหม่
                const newChannel = await guild.channels.create({
                    name: ticketId, // ใช้ ticket_id เดิม
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: ticketLog.user_id, // ผู้สร้างตั๋วดั้งเดิม
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages,
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: ticketConfig.role_id, // บทบาทแอดมิน/ทีมงาน
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        },
                        {
                            id: interaction.user.id, // ผู้เปิดตั๋วใหม่ (ในกรณีที่ไม่ใช่คนเดิม)
                            allow: [
                                PermissionsBitField.Flags.ViewChannel, 
                                PermissionsBitField.Flags.SendMessages, 
                                PermissionsBitField.Flags.ReadMessageHistory
                            ],
                        }
                    ],
                    topic: `ตั๋วที่เปิดใหม่จาก ${ticketLog.title} | ผู้เปิด: <@${interaction.user.id}>`
                });

                info(`สร้างช่อง ${newChannel.id} สำหรับตั๋ว ${ticketId} สำเร็จ`);

                // อัปเดตสถานะตั๋วเป็นเปิด
                await prisma.ticketLog.update({
                    where: {
                        ticket_id: ticketId
                    },
                    data: {
                        status: 'open',
                        channel_id: newChannel.id,
                        closed_at: null
                    }
                }).catch(err => {
                    error(`เกิดข้อผิดพลาดในการอัปเดตสถานะตั๋ว: ${err.message}`);
                    throw err; // โยนข้อผิดพลาดเพื่อให้ catch ด้านนอกจัดการ
                });

                info(`อัปเดตสถานะตั๋ว ${ticketId} เป็นเปิดสำเร็จ`);

                // ดึงข้อความเดิมทั้งหมดจากตั๋วที่ปิดไปแล้ว
                const messageLogs = await prisma.messageLog.findMany({
                    where: {
                        ticket_id: ticketId
                    },
                    orderBy: {
                        created_at: 'asc'
                    }
                }).catch(err => {
                    error(`เกิดข้อผิดพลาดในการดึงข้อความเก่า: ${err.message}`);
                    return []; // ถ้าดึงข้อความไม่ได้ ให้ใช้อาร์เรย์ว่าง
                });

                // ส่งข้อความแจ้งว่าเปิดตั๋วใหม่
                await newChannel.send({
                    content: `# ตั๋วถูกเปิดใหม่โดย <@${interaction.user.id}>\n\n**หัวข้อ:** ${ticketLog.title}\n**คำอธิบาย:** ${ticketLog.description || 'ไม่มี'}\n\n## ประวัติข้อความเดิม (${messageLogs.length} ข้อความ)`,
                });

                // แสดงข้อความเก่า
                if (messageLogs.length > 0) {
                    // สร้าง embed ที่เก็บข้อมูลเบื้องต้นของตั๋วเก่า
                    const ticketInfoEmbed = new EmbedBuilder()
                        .setTitle("ประวัติการสนทนาจากตั๋วเดิม")
                        .setDescription(`ตั๋วนี้เคยถูกปิดเมื่อ <t:${Math.floor(new Date(ticketLog.closed_at).getTime() / 1000)}:F>`)
                        .setColor(0x0099FF);
                    
                    await newChannel.send({ embeds: [ticketInfoEmbed] });
                    
                    // แบ่งข้อความเก่าเป็นชุด ชุดละไม่เกิน 10 ข้อความเพื่อไม่ให้ส่งมากจนเกินไป
                    const chunkSize = 10;
                    for (let i = 0; i < messageLogs.length; i += chunkSize) {
                        const messagesChunk = messageLogs.slice(i, i + chunkSize);
                        
                        // แปลงข้อความเก่าให้เป็นรูปแบบที่อ่านง่าย
                        let formattedMessages = '';
                        for (const msg of messagesChunk) {
                            const time = new Date(msg.created_at).toLocaleString('th-TH');
                            formattedMessages += `**${msg.username}** (${time}):\n${msg.content || '(ไม่มีข้อความ)'}\n\n`;
                        }
                        
                        // ส่งข้อความเก่า
                        if (formattedMessages) {
                            const embed = new EmbedBuilder()
                                .setDescription(formattedMessages)
                                .setColor(0xE0E0E0);
                            
                            await newChannel.send({ embeds: [embed] });
                        }
                    }
                    
                    // เพิ่มเส้นแบ่งระหว่างข้อความเก่ากับข้อความใหม่
                    await newChannel.send({
                        content: "----------------------------\n## การสนทนาใหม่เริ่มที่นี่"
                    });
                }

                // สร้างปุ่มปิดตั๋ว
                try {
                    const closeButton = client.buttonComponent.createButton('close-ticket', 'ปิดตั๋ว', 4, '🔒');
                    const row = client.buttonComponent.createRow([closeButton]);

                    await newChannel.send({
                        content: `<@${ticketLog.user_id}> ตั๋วของคุณถูกเปิดใหม่แล้ว`,
                        components: [row]
                    });

                    // แจ้งผู้เปิดตั๋วใหม่
                    await interaction.editReply({
                        content: `✅ เปิดตั๋วใหม่เรียบร้อยแล้ว! ไปที่ <#${newChannel.id}>`,
                    });

                    info(`เปิดตั๋ว ${ticketId} สำเร็จ ช่องใหม่คือ ${newChannel.id}`);
                } catch (err) {
                    error(`เกิดข้อผิดพลาดในการสร้างปุ่มหรือส่งข้อความ: ${err.message}`);
                    await interaction.editReply({
                        content: `เปิดตั๋วใหม่สำเร็จแล้ว แต่มีปัญหาในการสร้างปุ่ม ไปที่ <#${newChannel.id}>`,
                    });
                }
            } catch (err) {
                error(`เกิดข้อผิดพลาดในการสร้างช่องใหม่: ${err.message}`);
                await interaction.editReply({
                    content: `เกิดข้อผิดพลาดในการสร้างช่องใหม่: ${err.message}`,
                });
            }
        } catch (err) {
            error(`เกิดข้อผิดพลาดในการเปิดตั๋วใหม่: ${err}`);
            try {
                if (interaction.deferred) {
                    await interaction.editReply({
                        content: `เกิดข้อผิดพลาดในการเปิดตั๋วใหม่: ${err.message}\nโปรดติดต่อผู้ดูแลระบบและแจ้งข้อผิดพลาดนี้`,
                    });
                } else {
                    await interaction.reply({
                        content: `เกิดข้อผิดพลาดในการเปิดตั๋วใหม่: ${err.message}\nโปรดติดต่อผู้ดูแลระบบและแจ้งข้อผิดพลาดนี้`,
                        ephemeral: true
                    });
                }
            } catch (replyErr) {
                error(`เกิดข้อผิดพลาดในการตอบกลับการโต้ตอบหลังจากข้อผิดพลาดแรก: ${replyErr.message}`);
            }
        }
    }
}).toJSON(); 