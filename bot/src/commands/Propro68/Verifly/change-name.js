const { EmbedBuilder, ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info, error } = require("../../../utils/Console");
const ENV = require("../../../config/env");
const { prisma } = require("../../../utils/Database");
const axios = require("axios");

/**
 * Subcommand handler for verifly change-name
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    await interaction.deferReply({ flags: 64 });

    try {
        // รับ role ที่ต้องการเปลี่ยนชื่อจาก interaction
        const targetRole = interaction.options.getRole("role");

        if (!targetRole) {
            return interaction.editReply({
                content: "โปรดระบุบทบาท (Role) ที่ต้องการเปลี่ยนชื่อ"
            });
        }

        // แสดงข้อความระหว่างดำเนินการ
        const processingEmbed = new EmbedBuilder()
            .setTitle("กำลังเปลี่ยนชื่อสมาชิก")
            .setDescription(`กำลังดำเนินการเปลี่ยนชื่อสมาชิกที่มีบทบาท ${targetRole}...`)
            .setColor(0x3498DB)
            .setFooter({ text: "กรุณารอสักครู่..." })
            .setTimestamp();

        await interaction.editReply({ embeds: [processingEmbed] });

        // ดึงข้อมูลสมาชิกทั้งหมดที่มี role ที่กำหนด
        const membersWithRole = [];

        try {
            // ดึงข้อมูล role โดยตรง (ซึ่งจะมีสมาชิกใน cache อยู่แล้ว)
            const targetRoleObj = await interaction.guild.roles.fetch(targetRole.id);

            if (targetRoleObj && targetRoleObj.members) {
                // เก็บรายการสมาชิกจาก role.members ซึ่งเร็วกว่าการดึงทั้งหมด
                targetRoleObj.members.forEach(member => {
                    membersWithRole.push(member.id);
                });
            } else {
                error(`Error fetching role members: ${fetchError.message}`);
                return interaction.editReply({
                    content: `ไม่สามารถดึงข้อมูลสมาชิกที่มีบทบาท ${targetRole.name} ได้ โปรดลองอีกครั้งในภายหลัง`
                });
            }
        } catch (fetchError) {
            error(`Error fetching role members: ${fetchError.message}`);
            return interaction.editReply({
                content: `เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิกที่มีบทบาท ${targetRole.name}: ${fetchError.message}`
            });
        }

        if (membersWithRole.length === 0) {
            const noMembersEmbed = new EmbedBuilder()
                .setTitle("ไม่พบสมาชิก")
                .setDescription(`ไม่พบสมาชิกที่มีบทบาท ${targetRole}`)
                .setColor(0xE74C3C)
                .setFooter({ text: "ไม่สามารถดำเนินการได้" })
                .setTimestamp();

            return interaction.editReply({ embeds: [noMembersEmbed] });
        }

        // เก็บข้อมูลสมาชิกที่ต้องเปลี่ยนชื่อและไม่ต้องเปลี่ยนชื่อ
        const needsNameChange = [];
        const noNameChange = [];

        // อัปเดต embed ให้แสดงจำนวนสมาชิกที่จะประมวลผล
        const updatedProcessingEmbed = EmbedBuilder.from(processingEmbed)
            .setFooter({ text: `กำลังประมวลผล 0/${membersWithRole.length} คน...` });

        await interaction.editReply({ embeds: [updatedProcessingEmbed] });

        // ประมวลผลสมาชิกทีละคน
        let processedCount = 0;
        for (const memberId of membersWithRole) {
            processedCount++;

            // อัพเดตสถานะทุก 10 คน เพื่อแสดงความคืบหน้า
            if (processedCount % 10 === 0 || processedCount === membersWithRole.length) {
                const progressEmbed = EmbedBuilder.from(updatedProcessingEmbed)
                    .setFooter({ text: `กำลังประมวลผล ${processedCount}/${membersWithRole.length} คน...` });
                await interaction.editReply({ embeds: [progressEmbed] });
            }

            try {
                // ดึงสมาชิกทีละคนแทนที่จะดึงทั้งหมดพร้อมกัน
                const member = await interaction.guild.members.fetch(memberId).catch(() => null);
                if (!member) {
                    noNameChange.push(memberId);
                    continue;
                }

                // ตรวจสอบข้อมูลจาก API
                try {
                    const verifyUrl = `${ENV.verify.studentLink}${memberId}`;
                    const response = await axios.get(verifyUrl, {
                        headers: {
                            'Authorization': `${ENV.verify.authToken}`
                        }
                    });

                    // ถ้าไม่พบข้อมูลหรือเกิดข้อผิดพลาด
                    if (response.data.error) {
                        noNameChange.push(memberId);
                        continue;
                    }

                    // ถ้าพบข้อมูล ดำเนินการเปลี่ยนชื่อ
                    if (!response.data.camper || !response.data.camper[0] || !response.data.camper[0].user) {
                        noNameChange.push(memberId);
                        continue;
                    }

                    const userData = response.data.camper[0].user;

                    // ถ้ามีการตั้งชื่อตรงกับที่ควรจะเป็นอยู่แล้ว ให้ไม่ต้องเปลี่ยนชื่อ
                    if (userData && userData.nickname && userData.firstName) {
                        if (member.nickname === `${userData.nickname} ${userData.firstName}`) {
                            noNameChange.push(memberId);
                            continue;
                        }
                    } else {
                        noNameChange.push(memberId);
                        continue;
                    }

                    // เปลี่ยนชื่อ
                    const newNickname = `${userData.nickname} ${userData.firstName}`;
                    try {
                        await member.setNickname(newNickname);
                        needsNameChange.push(memberId);
                    } catch (nicknameError) {
                        error(`Error setting nickname for user ${memberId}: ${nicknameError.message}`);
                        noNameChange.push(memberId);
                    }
                } catch (apiError) {
                    error(`API error for user ${memberId}: ${apiError.message}`);
                    noNameChange.push(memberId);
                }
            } catch (memberError) {
                error(`Error processing member ${memberId}: ${memberError.message}`);
                noNameChange.push(memberId);
            }
        }

        // สร้าง embed สำหรับรายงานผล
        let description = `**สรุปผลการเปลี่ยนชื่อสมาชิกที่มีบทบาท ${targetRole}**\n\n`;
        description += `✅ มี ${noNameChange.length} คนที่ไม่ต้องเปลี่ยนชื่อ\n`;
        description += `🔄 มี ${needsNameChange.length} คนที่ได้รับการเปลี่ยนชื่อ\n\n`;

        if (needsNameChange.length > 0) {
            description += "**รายชื่อสมาชิกที่ได้รับการเปลี่ยนชื่อ:**\n";
            needsNameChange.forEach(userId => {
                description += `<@${userId}>\n`;
            });
        }

        const resultEmbed = new EmbedBuilder()
            .setTitle("เปลี่ยนชื่อสมาชิกเสร็จสิ้น")
            .setDescription(description)
            .setColor(0x2ECC71)
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: "ดำเนินการเสร็จสิ้น" })
            .setTimestamp();

        await interaction.editReply({ embeds: [resultEmbed] });

    } catch (err) {
        error(`Change name command error: ${err.message}`);

        const errorEmbed = new EmbedBuilder()
            .setTitle("❌ เกิดข้อผิดพลาด")
            .setDescription(`เกิดข้อผิดพลาดในการเปลี่ยนชื่อสมาชิก: ${err.message}`)
            .setColor(0xFF0000)
            .setFooter({ text: "โปรดติดต่อผู้ดูแลระบบ" })
            .setTimestamp();

        return interaction.editReply({ embeds: [errorEmbed] });
    }
}; 