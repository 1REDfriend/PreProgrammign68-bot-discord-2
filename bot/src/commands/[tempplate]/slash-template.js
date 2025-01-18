const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'name',
        description: 'description',
        type: 1,
        options: [
            {
                name: 'name',
                description: 'description',
                type: ApplicationCommandOptionType.String,
                required: true
            },
        ],
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

    }
}).toJSON();
