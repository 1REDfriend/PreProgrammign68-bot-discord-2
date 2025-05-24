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
            .setTitle('เริ่มต้นสร้าง Ticket เลย');

        const messageField = new TextInputBuilder()
            .setCustomId('create_ticket-field-1')
            .setLabel('หัวข้อ')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('กรอกข้อความหัวข้อเรื่อง')
            .setRequired(true)
            .setMaxLength(255)
            .setMinLength(2);

        const descriptionField = new TextInputBuilder()
            .setCustomId('create_ticket-field-2')
            .setLabel('คำอธิบายหัวข้อ')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('กรอกข้อความอธิบายเรื่องที่เกิดขึ้นสั้นๆ')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(255);

        const actionRow1 = new ActionRowBuilder().addComponents(messageField);
        const actionRow2 = new ActionRowBuilder().addComponents(descriptionField);

        modal.addComponents(actionRow1, actionRow2);

        await interaction.showModal(modal);
    }
}).toJSON()