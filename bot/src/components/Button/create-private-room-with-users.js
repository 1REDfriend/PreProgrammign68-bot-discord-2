const { ButtonInteraction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const Component = require("../../structure/Component");

module.exports = new Component({
    customId: 'create_private_room_with_users',
    type: 'button',
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        // Create a modal for room creation with users
        const modal = new ModalBuilder()
            .setCustomId('create_private_room_users_modal')
            .setTitle('Create Private Room');

        // Room name input
        const roomNameInput = new TextInputBuilder()
            .setCustomId('room_name')
            .setLabel('Room Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter a name for your private room')
            .setRequired(true)
            .setMaxLength(32)
            .setMinLength(3);

        // User IDs input (comma-separated)
        const userIdsInput = new TextInputBuilder()
            .setCustomId('user_ids')
            .setLabel('User IDs or Mentions (comma-separated)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter user IDs or @mentions separated by commas')
            .setRequired(true)
            .setMaxLength(1000);

        // Room description (optional)
        const roomDescription = new TextInputBuilder()
            .setCustomId('room_description')
            .setLabel('Room Description (optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Enter a description for your room')
            .setRequired(false)
            .setMaxLength(200);

        // Add inputs to action rows
        const firstActionRow = new ActionRowBuilder().addComponents(roomNameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(userIdsInput);
        const thirdActionRow = new ActionRowBuilder().addComponents(roomDescription);

        // Add action rows to modal
        modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);
    }
}).toJSON(); 