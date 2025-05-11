const { info, error, success } = require('../../utils/Console');
const { readdirSync } = require('fs');
const DiscordBot = require('../DiscordBot');
const Component = require('../../structure/Component');

class ComponentsHandler {
    client;

    /**
     *
     * @param {DiscordBot} client 
     */
    constructor(client) {
        this.client = client;
    }

    load = () => {
        let totalButtonComponents = 0;
        let totalSelectComponents = 0;
        let totalModalComponents = 0;
        let totalAutocompleteComponents = 0;

        // ช้อมูลจำนวน components ที่ใช้ regex
        let totalRegexButtons = 0;
        let totalRegexSelects = 0;
        let totalRegexModals = 0;

        for (const directory of readdirSync('./src/components/')) {
            for (const file of readdirSync('./src/components/' + directory).filter((f) => f.endsWith('.js'))) {
                try {
                    /**
                     * @type {Component['data']}
                     */
                    const module = require('../../components/' + directory + '/' + file);

                    if (!module) continue;

                    if (module.__type__ === 3) {
                        if (!module.customId || !module.run) {
                            error(`Unable to load the component ${file}`);
                            continue;
                        }

                        // ตรวจสอบว่า customId เป็น regex หรือไม่
                        const isRegex = module.customId instanceof RegExp;

                        if (module.type === 'button') {
                            if (isRegex) {
                                this.client.collection.components.regexButtons.set(module.customId, module);
                                totalRegexButtons++;
                            } else {
                                this.client.collection.components.buttons.set(module.customId, module);
                                totalButtonComponents++;
                            }
                        } else if (module.type === 'select') {
                            if (isRegex) {
                                this.client.collection.components.regexSelects.set(module.customId, module);
                                totalRegexSelects++;
                            } else {
                                this.client.collection.components.selects.set(module.customId, module);
                                totalSelectComponents++;
                            }
                        } else if (module.type === 'modal') {
                            if (isRegex) {
                                this.client.collection.components.regexModals.set(module.customId, module);
                                totalRegexModals++;
                            } else {
                                this.client.collection.components.modals.set(module.customId, module);
                                totalModalComponents++;
                            }
                        }

                        info(`Loaded new component: ${file} (Type: ${module.type}, CustomId: ${isRegex ? 'Regex Pattern' : module.customId})`);
                    } else if (module.__type__ === 4) {
                        if (!module.commandName || !module.run) {
                            error(`Unable to load the autocomplete component ${file}`);
                            continue;
                        }

                        this.client.collection.components.autocomplete.set(module.commandName, module);
                        totalAutocompleteComponents++;

                        info(`Loaded new autocomplete component: ${file} (Command: ${module.commandName})`);
                    }
                } catch (err) {
                    error(`Unable to load a component from the path: src/components/${directory}/${file}`);
                    console.error(err);
                }
            }
        }

        success(`Successfully loaded ${totalButtonComponents} button components.`);
        success(`Successfully loaded ${totalRegexButtons} regex button components.`);
        success(`Successfully loaded ${totalSelectComponents} select components.`);
        success(`Successfully loaded ${totalRegexSelects} regex select components.`);
        success(`Successfully loaded ${totalModalComponents} modal components.`);
        success(`Successfully loaded ${totalRegexModals} regex modal components.`);
        success(`Successfully loaded ${totalAutocompleteComponents} autocomplete components.`);
    }

    reload = () => {
        this.client.collection.components.autocomplete.clear();
        this.client.collection.components.buttons.clear();
        this.client.collection.components.regexButtons.clear();
        this.client.collection.components.modals.clear();
        this.client.collection.components.regexModals.clear();
        this.client.collection.components.selects.clear();
        this.client.collection.components.regexSelects.clear();

        this.load();
    }
}

module.exports = ComponentsHandler;