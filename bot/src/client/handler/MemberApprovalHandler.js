const { info, error, success } = require('../../utils/Console');
const { prisma } = require("../../utils/Database");
const DiscordBot = require('../DiscordBot');

class MemberApprovalHandler {
    client;

    /**
     *
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * โหลดระบบจัดการคำขอเข้าร่วมเซิร์ฟเวอร์
     */
    load = () => {
        // เริ่มต้นการติดตั้งระบบจัดการคำขอเข้าร่วมเซิร์ฟเวอร์
        success(`Successfully loaded member approval system.`);
    }

    /**
     * บันทึกคำขอเข้าร่วมเซิร์ฟเวอร์ใหม่ลงใน Database
     * @param {*} memberId - ID ของสมาชิกที่ส่งคำขอ
     * @param {*} guildId - ID ของเซิร์ฟเวอร์
     * @param {*} requestData - ข้อมูลเพิ่มเติมของคำขอ (ถ้ามี)
     * @returns {Promise<boolean>} สถานะการบันทึกข้อมูล
     */
    saveMemberRequest = async (memberId, guildId, requestData = {}) => {
        try {
            // บันทึกข้อมูลลงใน Prisma
            await prisma.memberRequest.create({
                data: {
                    memberId,
                    guildId,
                    status: 'pending',
                    requestData: JSON.stringify(requestData),
                    requestedAt: new Date()
                }
            });

            info(`New member request from ${memberId} in guild ${guildId} has been saved.`);
            return true;
        } catch (err) {
            error(`Failed to save member request: ${err.message}`);
            return false;
        }
    }

    /**
     * อัปเดตสถานะของคำขอเข้าร่วมเซิร์ฟเวอร์
     * @param {*} memberId - ID ของสมาชิกที่ส่งคำขอ
     * @param {*} guildId - ID ของเซิร์ฟเวอร์
     * @param {*} status - สถานะใหม่ ('approved', 'rejected', 'cancel')
     * @returns {Promise<boolean>} สถานะการอัปเดตข้อมูล
     */
    updateRequestStatus = async (memberId, guildId, status) => {
        try {
            // อัปเดตสถานะใน Prisma
            await prisma.memberRequest.update({
                where: {
                    memberId_guildId: {
                        memberId,
                        guildId
                    }
                },
                data: {
                    status,
                    updatedAt: new Date()
                }
            });

            info(`Member request from ${memberId} in guild ${guildId} has been updated to ${status}.`);
            return true;
        } catch (err) {
            error(`Failed to update member request status: ${err.message}`);
            return false;
        }
    }

    /**
     * ดึงข้อมูลคำขอเข้าร่วมเซิร์ฟเวอร์
     * @param {*} guildId - ID ของเซิร์ฟเวอร์
     * @param {*} status - สถานะที่ต้องการกรอง (ถ้าไม่ระบุจะดึงทั้งหมด)
     * @returns {Promise<Array>} รายการคำขอ
     */
    getMemberRequests = async (guildId, status = null) => {
        try {
            const where = { guildId };
            if (status) {
                where.status = status;
            }

            // ดึงข้อมูลจาก Prisma
            return await prisma.memberRequest.findMany({ where });
        } catch (err) {
            error(`Failed to get member requests: ${err.message}`);
            return [];
        }
    }
}

module.exports = MemberApprovalHandler; 