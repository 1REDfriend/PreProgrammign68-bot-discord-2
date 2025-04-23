const { EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info, error } = require("../../../utils/Console");
const ENV = require("../../../config/env");
const { prisma } = require("../../../utils/Database");
const axios = require("axios");

/**
 * Subcommand handler for verifly preprogramming
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
        // ตรวจสอบว่ามีการตั้งค่า role สำหรับยืนยันตัวตนหรือไม่
        const serverSettings = await prisma.serverSettings.findUnique({
            where: { guildId: interaction.guildId }
        });

        if (!serverSettings || !serverSettings.verifyRoleId) {
            return interaction.editReply({
                content: 'ยังไม่มีการตั้งค่า role สำหรับการยืนยันตัวตน กรุณาติดต่อผู้ดูแลระบบ'
            });
        }

        // บันทึกข้อมูลการยืนยันตัวตนของผู้ใช้
        await prisma.userVerification.upsert({
            where: {
                userId_guildId: {
                    userId: interaction.user.id,
                    guildId: interaction.guildId
                }
            },
            update: {
                status: 'pending',
                updatedAt: new Date()
            },
            create: {
                userId: interaction.user.id,
                guildId: interaction.guildId,
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // ตรวจสอบข้อมูลจาก API
        const verifyUrl = `${ENV.verify.studentLink}${interaction.user.id}`;

        const response = await axios.get(verifyUrl, {
            headers: {
                'Authorization': `Bearer ${ENV.verify.authToken}`
            }
        });

        // ถ้าไม่พบข้อมูลหรือเกิดข้อผิดพลาด
        if (response.data.error) {
            // อัปเดตสถานะเป็น rejected
            await prisma.userVerification.update({
                where: {
                    userId_guildId: {
                        userId: interaction.user.id,
                        guildId: interaction.guildId
                    }
                },
                data: {
                    status: 'rejected',
                    updatedAt: new Date()
                }
            });

            // แจ้งผู้ใช้ว่าไม่พบข้อมูล
            const errorEmbed = new EmbedBuilder()
                .setTitle('ไม่พบข้อมูล')
                .setDescription('ยังไม่พบข้อมูลของท่าน โปรดลองใหม่ภายหลัง')
                .setColor(0xFF0000)
                .setFooter({ text: 'Verification Failed' })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
            return;
        }

        // ถ้าพบข้อมูล
        // อัปเดตสถานะเป็น verified
        await prisma.userVerification.update({
            where: {
                userId_guildId: {
                    userId: interaction.user.id,
                    guildId: interaction.guildId
                }
            },
            data: {
                status: 'verified',
                verifiedAt: new Date(),
                updatedAt: new Date()
            }
        });

        // เพิ่ม role ให้กับผู้ใช้
        const role = interaction.guild.roles.cache.get(serverSettings.verifyRoleId);
        if (role) {
            await interaction.member.roles.add(role);
        }

        // เปลี่ยนชื่อโปรไฟล์ server
        const userData = await response.data.camper[0].user;
        if (userData && userData.nickname && userData.fisrtName) {
            const newNickname = `${userData.nickname} ${userData.fisrtName}`;
            await interaction.member.setNickname(newNickname);
        } else throw new Error('เกิดข้อผิดพลาดที่ระบบ ไม่พบข้อมูลชื่อโปรไฟล์จาก API');

        // แจ้งผลสำเร็จให้ผู้ใช้
        const successEmbed = new EmbedBuilder()
            .setTitle('ยืนยันตัวตนสำเร็จ')
            .setDescription('การยืนยันตัวตนเสร็จสมบูรณ์แล้ว')
            .setColor(0x00FF00)
            .setFooter({ text: 'Verification Complete' })
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed] });

        // ส่ง logs ไปยัง channel ที่กำหนด (ถ้ามี)
        if (serverSettings.verifyLogChannelId) {
            const logChannel = interaction.guild.channels.cache.get(serverSettings.verifyLogChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('การยืนยันตัวตนสำเร็จ')
                    .setDescription(`ผู้ใช้ **${interaction.user.username}** ได้รับการยืนยันตัวตนเรียบร้อยแล้ว`)
                    .addFields(
                        { name: 'ผู้ใช้', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'ไอดีผู้ใช้', value: interaction.user.id, inline: true },
                        { name: 'ชื่อในระบบ', value: newNickname, inline: true },
                        { name: 'เวลา', value: new Date().toLocaleString('th-TH'), inline: false }
                    )
                    .setColor(0x00FF00)
                    .setThumbnail(interaction.user.displayAvatarURL())
                    .setFooter({ text: 'Verification Logs' })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
            }
        }

    } catch (err) {
        error(`Verification error: ${err.message}`);

        const serverSettings = await prisma.serverSettings.findUnique({
            where: { guildId: interaction.guildId }
        });

        if (serverSettings && serverSettings.verifyLogChannelId) {
            const logChannel = interaction.guild.channels.cache.get(serverSettings.verifyLogChannelId);
            if (logChannel) {
                // สร้างข้อมูลเกี่ยวกับผู้ใช้เพื่อแสดงในล็อก
                const userTag = interaction.user.tag || 'ไม่ทราบชื่อ';
                const userId = interaction.user.id;
                const userAvatar = interaction.user.displayAvatarURL({ dynamic: true, size: 128 });
                const errorMsg = err.message || 'ไม่ทราบสาเหตุ';
                const currentTime = new Date().toLocaleString('th-TH', {
                    timeZone: 'Asia/Bangkok',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const logEmbed = new EmbedBuilder()
                    .setTitle('❌ เกิดข้อผิดพลาดในการยืนยันตัวตนไม่พบข้อมูล')
                    .setDescription(`เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่ภายหลัง หรือติดต่อผู้ดูแลระบบ`)
                    .addFields(
                        { name: '👤 ผู้ใช้', value: `<@${userId}> (${userTag})`, inline: true },
                        { name: '🆔 ไอดีผู้ใช้', value: userId, inline: true },
                        { name: '⏰ เวลา', value: currentTime, inline: true },
                        { name: '❓ สาเหตุของข้อผิดพลาด', value: `\`\`\`${errorMsg}\`\`\``, inline: false }
                    )
                    .setColor(0xFF0000)
                    .setThumbnail(userAvatar)
                    .setFooter({ text: 'Verification Error Log' })
                    .setTimestamp();

                await logChannel.send({ embeds: [logEmbed] });
                info(`Sent error log for user ${userTag} (${userId}) to the log channel`);
            }
        }

        const errorEmbed = new EmbedBuilder()
            .setTitle('เกิดข้อผิดพลาดไม่พบข้อมูล')
            .setDescription('เกิดข้อผิดพลาดในการยืนยันตัวตน กรุณาลองใหม่ภายหลัง หรือติดต่อผู้ดูแลระบบ')
            .setColor(0xFF0000)
            .setFooter({ text: 'Verification Error' })
            .setTimestamp();

        return interaction.editReply({ embeds: [errorEmbed] });
    }
}; 