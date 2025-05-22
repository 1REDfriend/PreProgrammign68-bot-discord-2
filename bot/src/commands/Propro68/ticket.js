const { ChatInputCommandInteraction, ApplicationCommandOptionType, ChannelType, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

const setupHandler = require("./Tickets/setup");
const findHandler = require("./Tickets/find");
const askCloseHandler = require("./Tickets/ask");
const uninstallHandler = require("./Tickets/uninstall");
const notificationHandler = require("./Tickets/notification");
module.exports = new ApplicationCommand({
    command: {
        name: 'ticket',
        description: 'Admin commands for managing tickets',
        type: 1,
        options: [
            {
                name: 'setup',
                description: 'Setup ticket point to spawn',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'title',
                        description: 'Set title for looking complete.',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'set_channel',
                        description: 'Set channel to create ticket interaction',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildText],
                        required: true
                    },
                    {
                        name: 'set_catagory',
                        description: 'Set category to create a ticket channel to show.',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildCategory],
                        required: true
                    },
                    {
                        name: 'set_role',
                        description: 'Set role admin/staff to see this ticket.',
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    },
                    {
                        name: 'description',
                        description: 'Description for looking interesting.',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                ]
            },
            {
                name: 'notification',
                description: 'Setup notification settings for tickets',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'channel',
                        description: 'Set channel to receive notifications when a ticket is created',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildText],
                        required: true
                    },
                    {
                        name: 'role',
                        description: 'Set role to be tagged in notifications',
                        type: ApplicationCommandOptionType.Role,
                        required: false
                    },
                ]
            },
            {
                name: 'find',
                description: 'Find a close ticket',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'show_closed',
                        description: 'ค้นหาเฉพาะตั๋วที่ปิดแล้วด้วยหรือไม่',
                        type: ApplicationCommandOptionType.Boolean,
                        required: true
                    },
                ]
            },
            {
                name: 'ask-close',
                description: 'ถามว่าจะปิดตั๋วหรือไม่',
                type: ApplicationCommandOptionType.Subcommand,
                options: []
            },
            {
                name: 'uninstall',
                description: 'ลบข้อมูลการตั้งค่า Ticket สำหรับเซิร์ฟเวอร์นี้',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'confirm',
                        description: 'ยืนยันการลบการตั้งค่า Ticket',
                        type: ApplicationCommandOptionType.Boolean,
                        required: true
                    },
                ]
            }
        ]
    },
    options: [{
        cooldown: 1000
    }],
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options?.getSubcommand();

        if (subcommand === 'setup') {
            return setupHandler(client, interaction);
        } else if (subcommand === 'find') {
            return findHandler(client, interaction);
        } else if (subcommand === 'ask-close') {
            return askCloseHandler(client, interaction);
        } else if (subcommand === 'uninstall') {
            return uninstallHandler(client, interaction);
        } else if (subcommand === 'notification') {
            return notificationHandler(client, interaction);
        } else {
            return interaction.reply({
                content: "Invalid subcommand.",
                flags: 64
            });
        }
    }
}).toJSON();
