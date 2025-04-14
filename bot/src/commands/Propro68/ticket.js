const { ChatInputCommandInteraction, ApplicationCommandOptionType, ChannelType } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

const setupHandler = require("./Tickets/setup");
const findHandler = require("./Tickets/find");

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
                name: 'find',
                description: 'Find a close ticket',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'ticket_id',
                        description: 'ID of the ticket to find.',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: 'who',
                        description: 'Find by username of user.',
                        type: ApplicationCommandOptionType.User,
                        required: false
                    },
                ]
            }
        ]
    },
    options: [{
        cooldown: 5000
    }],
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            return setupHandler(client, interaction);
        } else if (subcommand === 'find') {
            return findHandler(client, interaction);
        } else {
            return interaction.reply({
                content: "Invalid subcommand.",
                flags: 64
            });
        }
    }
}).toJSON();
