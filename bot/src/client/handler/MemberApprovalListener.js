const DiscordBot = require("../DiscordBot");
const { error, info, success } = require("../../utils/Console");
const { prisma } = require("../../utils/Database");

class MemberApprovalListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
        // ฟังก์ชันการจัดการคำขอเข้าร่วม
        this.memberApprovalHandler = client.memberApprovalHandler;

        // เมื่อมีคำขอเข้าร่วมเซิร์ฟเวอร์ใหม่
        client.on('guildMemberUpdate', async (oldMember, newMember) => {
            try {
                // ตรวจสอบว่าสมาชิกอยู่ในสถานะรอการอนุมัติหรือไม่
                if (newMember.pending && !oldMember.pending) {
                    // บันทึกคำขอลงในฐานข้อมูล
                    await this.memberApprovalHandler.saveMemberRequest(
                        newMember.id,
                        newMember.guild.id,
                        {
                            username: newMember.user.username,
                            joinedAt: new Date().toISOString()
                        }
                    );

                    info(`New pending member detected: ${newMember.user.username} (${newMember.id}) in ${newMember.guild.name}`);
                }

                // ตรวจสอบว่าสมาชิกได้รับการอนุมัติแล้วหรือไม่
                if (!newMember.pending && oldMember.pending) {
                    // อัปเดตสถานะในฐานข้อมูล
                    await this.memberApprovalHandler.updateRequestStatus(
                        newMember.id,
                        newMember.guild.id,
                        'approved'
                    );

                    info(`Member approved: ${newMember.user.username} (${newMember.id}) in ${newMember.guild.name}`);
                }
            } catch (err) {
                error(`Error handling member update: ${err.message}`);
            }
        });

        // เมื่อมีการลบคำขอเข้าร่วมเซิร์ฟเวอร์
        client.on('guildMemberRemove', async (member) => {
            try {
                // ตรวจสอบว่าสมาชิกนี้มีคำขอค้างอยู่หรือไม่
                const requests = await this.memberApprovalHandler.getMemberRequests(member.guild.id, 'pending');
                const pendingRequest = requests.find(req => req.memberId === member.id);

                if (pendingRequest) {
                    // อัปเดตสถานะเป็น cancel
                    await this.memberApprovalHandler.updateRequestStatus(
                        member.id,
                        member.guild.id,
                        'cancel'
                    );

                    info(`Member request cancelled: ${member.user.username} (${member.id}) left ${member.guild.name}`);
                }

                // ลบข้อมูลการยืนยันตัวตนเมื่อออกจากเซิร์ฟเวอร์
                try {
                    await prisma.userVerification.delete({
                        where: {
                            userId_guildId: {
                                userId: member.id,
                                guildId: member.guild.id
                            }
                        }
                    });
                    info(`Removed verification data for user: ${member.user.username} (${member.id})`);
                } catch (dbErr) {
                    // ข้อมูลอาจไม่มีอยู่ ไม่จำเป็นต้องทำอะไร
                }
            } catch (err) {
                error(`Error handling member remove: ${err.message}`);
            }
        });

        // เมื่อมีการปฏิเสธคำขอเข้าร่วมเซิร์ฟเวอร์ (จาก API การคัดกรอง)
        client.on('guildMemberRejected', async (guild, user) => {
            try {
                // อัปเดตสถานะในฐานข้อมูล
                await this.memberApprovalHandler.updateRequestStatus(
                    user.id,
                    guild.id,
                    'rejected'
                );

                info(`Member rejected: ${user.username} (${user.id}) in ${guild.name}`);
            } catch (err) {
                error(`Error handling member rejection: ${err.message}`);
            }
        });
    }
}

module.exports = MemberApprovalListener; 