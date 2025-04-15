const { ApplicationCommandOptionType, ChatInputCommandInteraction, ChannelType} = require("discord.js")
const ApplicationCommand = require("../../structure/ApplicationCommand")
const DiscordBot = require("../../client/DiscordBot");

const setupPrivateRoom = require("./PrivateRoom/setup");
const uninstallPrivateRoom = require("./PrivateRoom/uninstall");

module.exports = new ApplicationCommand({
    command : {
        name : 'create_private_room',
        description: 'Setup system for creating private rooms with selected users or roles.',
        type: 1,
        options : [
            {
                name: 'setup',
                description: 'Setup private room system with customizable options.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'title',
                        description: 'Set title for the embed message.',
                        type: ApplicationCommandOptionType.String,
                        required: true
                    },
                    {
                        name: 'channel',
                        description: 'Channel where the embed message with buttons will be placed.',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildText],
                        required: true
                    },
                    {
                        name: 'category',
                        description: 'Category where voice channels will be created.',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildCategory],
                        required: true
                    },
                    {
                        name: 'role',
                        description: 'Role that can always see the created channels.',
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    },
                    {
                        name: 'description',
                        description: 'Description for the embed message.',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            },
            {
                name : 'uninstall',
                description: 'Remove private room system setup.',
                type: ApplicationCommandOptionType.Subcommand
            }
        ]
    },
    options:[{
        adminOnly: true
    }],
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            await setupPrivateRoom(client, interaction);
        } else if (subcommand === 'uninstall') {
            await uninstallPrivateRoom(client, interaction);
        }
    }
}).toJSON(); 