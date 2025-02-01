const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

const NormalMessage = require('./message/Normal')
const EmbedsMessage = require('./message/Embeds')

module.exports = new ApplicationCommand({
    command : {
        name: "message",
        description: "Create message to send by bot.",
        type: 1,
        options: [
            {
                name: "normal",
                description: 'send normal message to channel.',
                type: ApplicationCommandOptionType.Subcommand,
                required: true,
                options: [
                    {
                        name: "message",
                        description: "Message",
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: "channel",
                        type: ApplicationCommandOptionType.Channel,
                        required: false
                    },
                    {
                        name: 'image',
                        description: "image",
                        type: ApplicationCommandOptionType.Attachment,
                        required: false
                    }
                ]
            },
            {
                name: "embeds",
                description: "Create a embeds message.",
                type: ApplicationCommandOptionType.Subcommand,
                required: true,
                options: [
                    {
                        name: 'title',
                        type: ApplicationCommandOptionType.String,
                        required: true,
                    },
                    {
                        name: 'description',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    },
                    {
                        name: "channel",
                        type: ApplicationCommandOptionType.Channel,
                        required: false
                    },
                    {
                        name: 'attachment',
                        description: 'image / pdf / file.',
                        type: ApplicationCommandOptionType.Attachment,
                        required: false
                    },
                    {
                        name: "color",
                        description: 'Hex Embeds color. HEX ONLY!',
                        type: ApplicationCommandOptionType.String,
                        required: false
                    }
                ]
            }
        ]
    },
    options: {
        cooldown: 5000,
        adminOnly: true,
    },

    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand()

        if (subcommand == "normal") {
            return NormalMessage(client, interaction)
        } else if (subcommand == "embeds") {
            return EmbedsMessage(client, interaction)
        }

    }
}).toJSON()