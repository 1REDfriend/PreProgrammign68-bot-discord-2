const DiscordBot = require("../DiscordBot");
const config = require("../../config");
const { error } = require("../../utils/Console");

class ComponentsListener {
    /**
     * 
     * @param {DiscordBot} client 
     */
    constructor(client) {
        client.on('interactionCreate', async (interaction) => {
            const checkUserPermissions = async (component) => {
                if (component.options?.public === false && interaction.user.id !== interaction.message.interaction.user.id) {
                    await interaction.reply({
                        content: config.messages.COMPONENT_NOT_PUBLIC,
                        ephemeral: true
                    });

                    return false;
                }

                return true;
            }

            try {
                if (interaction.isButton()) {
                    // ตรวจสอบ customId แบบปกติก่อน
                    const component = client.collection.components.buttons.get(interaction.customId);

                    if (component) {
                        if (!(await checkUserPermissions(component))) return;

                        try {
                            component.run(client, interaction);
                            return;
                        } catch (err) {
                            error(err);
                            return;
                        }
                    }

                    // หากไม่พบ customId แบบปกติ ให้ตรวจสอบ customId แบบ regex
                    const regexComponents = client.collection.components.regexButtons;
                    if (regexComponents.size > 0) {
                        for (const [pattern, component] of regexComponents) {
                            if (pattern.test(interaction.customId)) {
                                if (!(await checkUserPermissions(component))) return;

                                try {
                                    component.run(client, interaction);
                                    return;
                                } catch (err) {
                                    error(err);
                                    return;
                                }
                            }
                        }
                    }

                    return;
                }

                if (interaction.isAnySelectMenu()) {
                    // ตรวจสอบ customId แบบปกติก่อน
                    const component = client.collection.components.selects.get(interaction.customId);

                    if (component) {
                        if (!(await checkUserPermissions(component))) return;

                        try {
                            component.run(client, interaction);
                            return;
                        } catch (err) {
                            error(err);
                            return;
                        }
                    }

                    // หากไม่พบ customId แบบปกติ ให้ตรวจสอบ customId แบบ regex
                    const regexComponents = client.collection.components.regexSelects;
                    if (regexComponents.size > 0) {
                        for (const [pattern, component] of regexComponents) {
                            if (pattern.test(interaction.customId)) {
                                if (!(await checkUserPermissions(component))) return;

                                try {
                                    component.run(client, interaction);
                                    return;
                                } catch (err) {
                                    error(err);
                                    return;
                                }
                            }
                        }
                    }

                    return;
                }

                if (interaction.isModalSubmit()) {
                    // ตรวจสอบ customId แบบปกติก่อน
                    const component = client.collection.components.modals.get(interaction.customId);

                    if (component) {
                        try {
                            component.run(client, interaction);
                            return;
                        } catch (err) {
                            error(err);
                            return;
                        }
                    }

                    // หากไม่พบ customId แบบปกติ ให้ตรวจสอบ customId แบบ regex
                    const regexComponents = client.collection.components.regexModals;
                    if (regexComponents.size > 0) {
                        for (const [pattern, component] of regexComponents) {
                            if (pattern.test(interaction.customId)) {
                                try {
                                    component.run(client, interaction);
                                    return;
                                } catch (err) {
                                    error(err);
                                    return;
                                }
                            }
                        }
                    }

                    return;
                }

                if (interaction.isAutocomplete()) {
                    const component = client.collection.components.autocomplete.get(interaction.commandName);

                    if (!component) return;

                    try {
                        component.run(client, interaction);
                    } catch (err) {
                        error(err);
                    }

                    return;
                }
            } catch (err) {
                error(err);
            }
        });
    }
}

module.exports = ComponentsListener;