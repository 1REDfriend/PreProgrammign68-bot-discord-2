const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction } = require("discord.js");
const DiscordBot = require("../../../client/DiscordBot");
const { info } = require("../../../utils/Console");
const { run } = require("../../../client/handler/DatabaseHandler");
const SQLite = require("../../../client/handler/DatabaseHandler");

/**
 * Subcommand handler for ticket setup
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description') || "Click the button below to create a ticket.";
    const setChannel = interaction.options.getChannel('set_channel');
    const setCategory = interaction.options.getChannel('set_catagory');
    const setRole = interaction.options.getRole('set_role');
    const db = new SQLite()

    if (!setChannel.isTextBased()) {
        return interaction.reply({
            content: "The channel for interaction must be a text-based channel.",
            ephemeral: true
        });
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00AE86);

    const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(button);

    try {
        await db.run(`
            INSERT OR REPLACE INTO tickets (guild_id, category_id, role_id, channel_id)
            VALUES (?, ?, ?, ?)
        `, [
            interaction.guildId,    // Guild ID
            setCategory.id, // Category ID
            setRole.id,     // Role ID
            setChannel.id   // Channel ID
        ]);

        await setChannel.send({ embeds: [embed], components: [actionRow] });

        await interaction.reply({
            content: `Ticket setup successfully in ${setChannel}.`,
            flags: 64
        });

        info(`Ticket setup saved by server ${interaction.guild.name} admin ${interaction.user.globalName}`);
    } catch (error) {
        console.error('Failed to setup ticket:', error.message);
        return interaction.reply({
            content: "An error occurred while setting up the ticket.",
            flags: 64
        });
    }
};
