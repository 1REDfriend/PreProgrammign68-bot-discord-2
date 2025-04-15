const { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");

module.exports = new Component({
    customId: 'create_private_room_with_role',
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        // Create a modal for room creation with role
        const modal = new ModalBuilder()
            .setCustomId('create_private_room_role_modal')
            .setTitle('สร้างห้องส่วนตัว');

        // Room name input
        const roomNameInput = new TextInputBuilder()
            .setCustomId('room_name')
            .setLabel('ชื่อห้อง')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('กรอกชื่อสำหรับห้องส่วนตัวของคุณ')
            .setRequired(true)
            .setMaxLength(32)
            .setMinLength(3);

        // Room description (optional)
        const roomDescription = new TextInputBuilder()
            .setCustomId('room_description')
            .setLabel('คำอธิบายห้อง (ไม่จำเป็น)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('กรอกคำอธิบายสำหรับห้องของคุณ')
            .setRequired(false)
            .setMaxLength(200);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(roomNameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(roomDescription);

        // Add action rows to modal
        modal.addComponents(firstActionRow, secondActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    }
}).toJSON(); 