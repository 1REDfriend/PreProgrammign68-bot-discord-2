const { ApplicationCommandOptionType, ChatInputCommandInteraction, ChannelType} = require("discord.js")
const ApplicationCommand = require("../../structure/ApplicationCommand")
const DiscordBot = require("../../client/DiscordBot");

const { setupAutoCreateRoom } = require("./ATC_Room/setup")
const { uninstallAutoCreateRoom } = require("./ATC_Room/uninstall");

module.exports = new ApplicationCommand({
    command : {
        name : 'create_room',
        description: 'setup your every thing if you need.',
        type: 1,
        options : [
            {
                name: 'setup',
                description: 'install base waiting to create voice channel.',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'channel',
                        description: 'channel to install for waiting to create a voice channel.',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildVoice],
                        required: true
                    },
                    {
                        name : 'create_on',
                        description: 'catagory to spawn voice channel.',
                        type: ApplicationCommandOptionType.Channel,
                        channel_types: [ChannelType.GuildCategory],
                        required: true
                    }
                ]
            },
            {
                name : 'uninstall',
                description: 'uninstall setup',
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
            await setupAutoCreateRoom(client, interaction);
        } else if (subcommand === 'uninstall') {
            await uninstallAutoCreateRoom(client, interaction);
        }
    }
}).toJSON();