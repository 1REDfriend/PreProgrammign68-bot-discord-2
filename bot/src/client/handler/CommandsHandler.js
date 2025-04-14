const { REST, Routes } = require('discord.js');
const { info, error, success, warn } = require('../../utils/Console');
const { readdirSync } = require('fs');
const DiscordBot = require('../DiscordBot');
const ApplicationCommand = require('../../structure/ApplicationCommand');
const MessageCommand = require('../../structure/MessageCommand');

class CommandsHandler {
    client;

    /**
     *
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
    }

    load = () => {
        for (const directory of readdirSync('./src/commands/').filter((f) => !f.startsWith("["))) {
            for (const file of readdirSync('./src/commands/' + directory).filter((f) => f.endsWith('.js'))) {
                try {
                    /**
                     * @type {ApplicationCommand['data'] | MessageCommand['data']}
                     */
                    const module = require('../../commands/' + directory + '/' + file);

                    if (!module) continue;

                    if (module.__type__ === 2) {
                        if (!module.command || !module.run) {
                            error('Unable to load the message command ' + file);
                            continue;
                        }

                        this.client.collection.message_commands.set(module.command.name, module);

                        if (module.command.aliases && Array.isArray(module.command.aliases)) {
                            module.command.aliases.forEach((alias) => {
                                this.client.collection.message_commands_aliases.set(alias, module.command.name);
                            });
                        }

                        info('Loaded new message command: ' + file);
                    } else if (module.__type__ === 1) {
                        if (!module.command || !module.run) {
                            error('Unable to load the application command ' + file);
                            continue;
                        }

                        this.client.collection.application_commands.set(module.command.name, module);
                        this.client.rest_application_commands_array.push(module.command);

                        info('Loaded new application command: ' + file);
                    } else {
                        error('Invalid command type ' + module.__type__ + ' from command file ' + file);
                    }
                } catch {
                    error('Unable to load a command from the path: ' + 'src/commands/' + directory + '/' + file);
                }
            }
        }

        success(`Successfully loaded ${this.client.collection.application_commands.size} application commands and ${this.client.collection.message_commands.size} message commands.`);
    }

    reload = () => {
        this.client.collection.message_commands.clear();
        this.client.collection.message_commands_aliases.clear();
        this.client.collection.application_commands.clear();
        this.client.rest_application_commands_array = [];

        this.load();
    }
    
    /**
     * Deletes all application commands from a guild or globally
     * @param {{ enabled: boolean, guildId: string }} development
     * @param {Partial<import('discord.js').RESTOptions>} restOptions 
     */
    deleteApplicationCommands = async (development, restOptions = null) => {
        const rest = new REST(restOptions ? restOptions : { version: '10' }).setToken(this.client.token);
        
        try {
            warn('Attempting to delete all existing application commands...');
            
            if (development.enabled) {
                // Delete commands from specific guild
                await rest.put(Routes.applicationGuildCommands(this.client.user.id, development.guildId), { body: [] });
                success(`Successfully deleted all application commands from guild ${development.guildId}`);
            } else {
                // Get all guilds the bot is in
                const guilds = this.client.guilds.cache;
                
                // Delete global commands
                await rest.put(Routes.applicationCommands(this.client.user.id), { body: [] });
                success('Successfully deleted all global application commands');
                
                // Delete commands from each guild
                for (const [guildId, guild] of guilds) {
                    try {
                        await rest.put(Routes.applicationGuildCommands(this.client.user.id, guildId), { body: [] });
                        success(`Successfully deleted all application commands from guild ${guildId} (${guild.name})`);
                    } catch (err) {
                        error(`Failed to delete application commands from guild ${guildId}: ${err.message}`);
                    }
                }
            }
        } catch (err) {
            error(`Failed to delete application commands: ${err.message}`);
        }
    }
    
    /**
     * @param {{ enabled: boolean, guildId: string }} development
     * @param {Partial<import('discord.js').RESTOptions>} restOptions 
     */
    registerApplicationCommands = async (development, restOptions = null) => {
        const rest = new REST(restOptions ? restOptions : { version: '10' }).setToken(this.client.token);

        if (development.enabled) {
            await rest.put(Routes.applicationGuildCommands(this.client.user.id, development.guildId), { body: this.client.rest_application_commands_array });
        } else {
            await rest.put(Routes.applicationCommands(this.client.user.id), { body: this.client.rest_application_commands_array });
        }
    }
}

module.exports = CommandsHandler;