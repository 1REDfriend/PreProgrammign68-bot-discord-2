// bot/src/components/Button/create-ticket-button.js
const { ButtonInteraction, TextInputStyle, ModalBuilder, TextInputBuilder, ActionRowBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");

module.exports = new Component({
    customId: 'create_ticket',
    type: 'button',
    /**
     *
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {

        const modal = new ModalBuilder()
            .setCustomId('create_ticket')
            .setTitle('Create a Ticket');

        const messageField = new TextInputBuilder()
            .setCustomId('create_ticket-field-1')
            .setLabel('What message do you want to show?')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter your message here!')
            .setRequired(true)
            .setMaxLength(255)
            .setMinLength(2);

        const descriptionField = new TextInputBuilder()
            .setCustomId('create_ticket-field-2')
            .setLabel('What message description do you want to show?')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter your message here!')
            .setRequired(false)
            .setMaxLength(255);

        const actionRow1 = new ActionRowBuilder().addComponents(messageField);
        const actionRow2 = new ActionRowBuilder().addComponents(descriptionField);

        modal.addComponents(actionRow1, actionRow2);

        await interaction.showModal(modal);
    }
}).toJSON()