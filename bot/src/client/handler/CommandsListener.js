const { PermissionsBitField, ChannelType } = require("discord.js");
const DiscordBot = require("../DiscordBot");
const config = require("../../config");
const MessageCommand = require("../../structure/MessageCommand");
const { handleMessageCommandOptions, handleApplicationCommandOptions } = require("./CommandOptions");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const { error, info } = require("../../utils/Console");

class CommandsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return;

            if (!config.commands.application_commands.chat_input && interaction.isChatInputCommand()) return;
            if (!config.commands.application_commands.user_context && interaction.isUserContextMenuCommand()) return;
            if (!config.commands.application_commands.message_context && interaction.isMessageContextMenuCommand()) return;

            /**
             * @type {ApplicationCommand['data']}
             */
            const command = client.collection.application_commands.get(interaction.commandName);

            if (!command) return;

            info(`${interaction.user.displayName} use /${command.command.name} on server [${interaction.guild.name}]`)

            try {
                if (command.options) {
                    const commandContinue = await handleApplicationCommandOptions(interaction, command.options, command.command);

                    if (!commandContinue) return;
                }

                command.run(client, interaction);
            } catch (err) {
                error(err);
            }
        });
    }
}

module.exports = CommandsListener;