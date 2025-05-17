const { EmbedBuilder, ChatInputCommandInteraction, ApplicationCommandOptionType, Collection } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info, error } = require("../../../utils/Console");
const ENV = require("../../../config/env");
const { prisma } = require("../../../utils/Database");
const axios = require("axios");

/**
 * สร้างฟังก์ชันสำหรับหน่วงเวลา (delay)
 * @param {number} ms เวลาที่ต้องการหน่วงเป็นมิลลิวินาที
 * @returns {Promise} Promise ที่จะ resolve หลังจากหน่วงเวลาแล้ว
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Subcommand handler for verifly change-name
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

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

        // เก็บข้อมูลสมาชิกที่ต้องเปลี่ยนชื่อและไม่ต้องเปลี่ยนชื่อ
        const needsNameChange = [];
        const noNameChange = [];

        // ดึงข้อมูลสมาชิกเป็นกลุ่มๆ ละ 10 คน และเปลี่ยนชื่อทันที
        const BATCH_SIZE = 1000;
        let lastId = '0';
        let continueLoop = true;
        let totalProcessed = 0;

        // ค่าหน่วงเวลา (มิลลิวินาที)
        const FETCH_DELAY = 1000; // หน่วงเวลา 1 วินาทีหลังดึงข้อมูลแต่ละกลุ่ม
        const API_DELAY = 500;    // หน่วงเวลา 0.5 วินาทีหลังเรียก API
        const NICKNAME_DELAY = 1000; // หน่วงเวลา 1 วินาทีหลังเปลี่ยนชื่อ

        // เก็บ ID ของสมาชิกที่ประมวลผลไปแล้ว เพื่อป้องกันการทำซ้ำ
        const processedMemberIds = new Set();

        while (continueLoop) {
            // อัปเดตข้อความแสดงสถานะ
            const progressEmbed = new EmbedBuilder()
                .setTitle("กำลังเปลี่ยนชื่อสมาชิก")
                .setDescription(`กำลังดึงข้อมูลสมาชิกกลุ่มใหม่... ดำเนินการแล้ว ${totalProcessed} คน`)
                .setColor(0x3498DB)
                .setFooter({ text: "กรุณารอสักครู่..." })
                .setTimestamp();

            await interaction.editReply({ embeds: [progressEmbed] });

            try {
                // ดึงสมาชิกครั้งละ 10 คน
                const options = { limit: BATCH_SIZE };
                if (lastId !== '0') {
                    options.after = lastId;
                }

                info(`Fetching members with options: ${JSON.stringify(options)}`);
                const fetchedMembers = await interaction.guild.members.fetch(options);
                info(`Fetched ${fetchedMembers.size} members`);

                // หน่วงเวลาหลังดึงข้อมูลสมาชิกเพื่อป้องกัน rate limit
                await sleep(FETCH_DELAY);

                if (fetchedMembers.size === 0) {
                    info('No more members to fetch, ending loop');
                    continueLoop = false;
                    continue;
                }

                // เก็บ ID สุดท้ายสำหรับการดึงข้อมูลครั้งถัดไป
                const fetchedMemberArray = Array.from(fetchedMembers.values());
                if (fetchedMemberArray.length > 0) {
                    lastId = fetchedMemberArray[fetchedMemberArray.length - 1].id;
                    info(`Last member ID for next fetch: ${lastId}`);
                }

                // กรองสมาชิกที่มีบทบาทตามที่ต้องการและยังไม่เคยประมวลผล
                const batchMembersWithRole = [];
                let foundNewMembers = false;

                for (const [memberId, member] of fetchedMembers) {
                    // ถ้า ID นี้เคยประมวลผลแล้ว ข้ามไป
                    if (processedMemberIds.has(memberId)) {
                        continue;
                    }

                    // เพิ่ม ID นี้เข้าไปในเซ็ตที่ประมวลผลแล้ว
                    processedMemberIds.add(memberId);
                    foundNewMembers = true;

                    if (member.roles.cache.has(targetRole.id)) {
                        batchMembersWithRole.push({ id: memberId, member });
                    }
                }

                info(`Found ${batchMembersWithRole.length} members with role to process`);

                // ถ้าไม่มีสมาชิกใหม่ที่ยังไม่เคยประมวลผล ออกจาก loop
                if (!foundNewMembers) {
                    info('No new members found, ending loop');
                    continueLoop = false;
                    continue;
                }

                // ดำเนินการกับสมาชิกในกลุ่มนี้ทันที
                for (const { id: memberId, member } of batchMembersWithRole) {
                    // อัปเดตข้อความแสดงความคืบหน้า
                    totalProcessed++;

                    if (totalProcessed % 5 === 0) {
                        const statusEmbed = new EmbedBuilder()
                            .setTitle("กำลังเปลี่ยนชื่อสมาชิก")
                            .setDescription(`กำลังดำเนินการ... ดำเนินการแล้ว ${totalProcessed} คน`)
                            .setColor(0x3498DB)
                            .setFooter({ text: "กรุณารอสักครู่..." })
                            .setTimestamp();

                        await interaction.editReply({ embeds: [statusEmbed] });
                    }

                    try {
                        // ตรวจสอบข้อมูลจาก API
                        const verifyUrl = `${ENV.verify.studentLink}${memberId}`;

                        const response = await axios.get(verifyUrl, {
                            headers: {
                                'Authorization': `${ENV.verify.authToken}`
                            }
                        });

                        // หน่วงเวลาหลังเรียกใช้ API ภายนอก
                        await sleep(API_DELAY);

                        // ถ้าไม่พบข้อมูลหรือเกิดข้อผิดพลาด
                        if (response.data.error) {
                            noNameChange.push(memberId);
                            continue;
                        }

                        // ถ้าพบข้อมูล ดำเนินการเปลี่ยนชื่อ
                        const userData = response.data.camper[0].user;

                        // ถ้ามีการตั้งชื่อตรงกับที่ควรจะเป็นอยู่แล้ว ให้ไม่ต้องเปลี่ยนชื่อ
                        if (userData && userData.nickname && userData.firstName) {
                            info(`Check : ${member.nickname} ${userData.nickname} ${userData.firstName}`);
                            if (member.nickname === `${userData.nickname} ${userData.firstName}`) {
                                noNameChange.push(memberId);
                                continue;
                            }
                        }

                        if (userData && userData.nickname && userData.firstName) {
                            const newNickname = `${userData.nickname} ${userData.firstName}`;

                            // ถ้าชื่อไม่ตรงกับที่ควรจะเป็น ให้เปลี่ยนชื่อ
                            if (member.nickname !== newNickname) {
                                await member.setNickname(newNickname);
                                // หน่วงเวลาหลังเปลี่ยนชื่อเพื่อป้องกัน rate limit
                                await sleep(NICKNAME_DELAY);
                                needsNameChange.push(memberId);
                            } else {
                                noNameChange.push(memberId);
                            }
                        } else {
                            noNameChange.push(memberId);
                        }
                    } catch (err) {
                        error(`Error changing name for user ${memberId}: ${err.message}`);
                        noNameChange.push(memberId);
                        // หน่วงเวลาเมื่อเกิดข้อผิดพลาด
                        await sleep(API_DELAY);
                    }
                }

                // ถ้าดึงมาน้อยกว่าที่ตั้งไว้ แสดงว่าหมดแล้ว
                if (fetchedMembers.size < BATCH_SIZE) {
                    info('Fetched fewer members than batch size, ending loop');
                    continueLoop = false;
                }
            } catch (err) {
                error(`Error in fetch batch: ${err.message}`);
                continueLoop = false;
                // หน่วงเวลาเมื่อเกิดข้อผิดพลาด
                await sleep(FETCH_DELAY);
            }
        }

        if (needsNameChange.length === 0 && noNameChange.length === 0) {
            const noMembersEmbed = new EmbedBuilder()
                .setTitle("ไม่พบสมาชิก")
                .setDescription(`ไม่พบสมาชิกที่มีบทบาท ${targetRole}`)
                .setColor(0xE74C3C)
                .setFooter({ text: "ไม่สามารถดำเนินการได้" })
                .setTimestamp();

            return interaction.editReply({ embeds: [noMembersEmbed] });
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