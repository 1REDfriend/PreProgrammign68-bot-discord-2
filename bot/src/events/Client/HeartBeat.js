import { error } from "../../utils/Console";

const { PrismaClient } = require("@prisma/client");
const DiscordBot = require("../../client/DiscordBot");
const prisma = new PrismaClient()

/**
 * 
 * @param {DiscordBot} client
 * 
*/
export default async function sendHeartbeat(client) {
    try {
        await prisma.botAlive.create({
            data: {
                name: client.user.displayName,
                client_id: client.user.id
            }
        })
    } catch (e) {
        error(e)
    } finally {
        prisma.$disconnect
    }
}