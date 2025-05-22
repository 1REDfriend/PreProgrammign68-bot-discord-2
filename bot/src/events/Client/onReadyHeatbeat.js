const { prisma } = require("../../utils/Database")
const Event = require("../../structure/Event")
const { error } = require("../../utils/Console")
const DiscordBot = require("../../client/DiscordBot")

module.exports = new Event({
    event: 'ready',
    once: false,


    run: async (__client__, client) => {
        /**
        * 
        * @param {DiscordBot} client 
        */
        async function sendHeartbeat(client) {
            try {
                await prisma.botAlive.create({
                    data: {
                        name: client.user.displayName,
                        client_id: client.user.id,
                    }
                })
            } catch (e) {
                error(e)
            } finally {
                prisma.$disconnect()
            }
        }

        await sendHeartbeat(client)
        setInterval(() => sendHeartbeat(client), 5 * 60 * 1000)
    }
}).toJSON()
