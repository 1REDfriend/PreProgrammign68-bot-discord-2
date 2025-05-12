const { EmbedBuilder, ChatInputCommandInteraction, ApplicationCommandOptionType, InteractionResponseFlags } = require("discord.js");
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
    await interaction.deferReply({ flags: [InteractionResponseFlags.Ephemeral] });

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
            // แยกเป็นชุดข้อมูลเล็กๆ เพื่อหลีกเลี่ยงปัญหา timeout
            const fetchOptions = { limit: 100 };
            let members = await interaction.guild.members.fetch(fetchOptions);

            // เก็บสมาชิกที่มี role ที่กำหนด
            for (const member of members.values()) {
                if (member.roles.cache.has(targetRole.id)) {
                    membersWithRole.push(member.id);
                }
            }

            // ดึงข้อมูลเพิ่มเติมถ้ามีสมาชิกมากกว่า 100 คน
            while (members.size === 100) {
                const lastMember = members.last();
                fetchOptions.after = lastMember.id;
                members = await interaction.guild.members.fetch(fetchOptions);

                for (const member of members.values()) {
                    if (member.roles.cache.has(targetRole.id)) {
                        membersWithRole.push(member.id);
                    }
                }
            }
        } catch (fetchError) {
            error(`Error fetching members: ${fetchError.message}`);

            // วิธีที่ 2: ให้ลองดึงข้อมูล role โดยตรง
            try {
                const role = await interaction.guild.roles.fetch(targetRole.id);
                if (role) {
                    // ในบางกรณี Discord.js จะโหลด member ของ role มาให้โดยอัตโนมัติ
                    if (role.members && role.members.size > 0) {
                        for (const [memberId, member] of role.members) {
                            membersWithRole.push(memberId);
                        }
                    }
                    // ถ้าไม่มีข้อมูล members คือยังไม่ได้โหลด ให้โหลด role พร้อม members
                    else {
                        const guildWithRoles = await interaction.guild.fetch();
                        const roleWithMembers = await guildWithRoles.roles.fetch(targetRole.id, { force: true, cache: true });

                        if (roleWithMembers && roleWithMembers.members) {
                            for (const [memberId, member] of roleWithMembers.members) {
                                membersWithRole.push(memberId);
                            }
                        }
                    }
                }
            } catch (roleError) {
                error(`Error fetching role members: ${roleError.message}`);
                return interaction.editReply({
                    content: "เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก โปรดลองอีกครั้งในภายหลัง"
                });
            }
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

        // ดำเนินการกับสมาชิกแต่ละคน
        for (const memberId of membersWithRole) {
            try {
                // ดึงข้อมูลสมาชิกอีกครั้งเพื่อป้องกันปัญหา cache
                const member = await interaction.guild.members.fetch(memberId).catch(() => null);
                if (!member) {
                    noNameChange.push(memberId);
                    continue;
                }

                // ตรวจสอบข้อมูลจาก API
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
                const userData = response.data.camper[0].user;

                // ถ้ามีการตั้งชื่อตรงกับที่ควรจะเป็นอยู่แล้ว ให้ไม่ต้องเปลี่ยนชื่อ
                if (userData && userData.nickname && userData.firstName) {
                    if (member.nickname === `${userData.nickname} ${userData.firstName}`) {
                        noNameChange.push(memberId);
                        continue;
                    }
                }

                if (userData && userData.nickname && userData.firstName) {
                    const newNickname = `${userData.nickname} ${userData.firstName}`;

                    // ถ้าชื่อไม่ตรงกับที่ควรจะเป็น ให้เปลี่ยนชื่อ
                    try {
                        await member.setNickname(newNickname);
                        needsNameChange.push(memberId);
                    } catch (nicknameError) {
                        error(`Error setting nickname for user ${memberId}: ${nicknameError.message}`);
                        noNameChange.push(memberId);
                    }
                } else {
                    noNameChange.push(memberId);
                }
            } catch (err) {
                error(`Error changing name for user ${memberId}: ${err.message}`);
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