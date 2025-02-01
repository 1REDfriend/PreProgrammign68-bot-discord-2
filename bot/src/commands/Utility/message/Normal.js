const DiscordBot = require("../../../client/DiscordBot");
const { ChatInputCommandInteraction } = require('discord.js')

/**
 * 
 * @param {DiscordBot} client 
 * @param {ChatInputCommandInteraction} interaction 
 */
module.exports = async (client, interaction) => {
    const message = interaction.options.getString('message')
    const channel = interaction.options.getChannel('channel')
    const attachment = interaction.options.getAttachment('attachment')

    let payload = { content: message };

    if (attachment) {
        payload.files = [attachment.url];
    }

    if (channel) {
        await channel.send(payload);
    } else {
        await interaction.channel.send(payload);
    }

    await interaction.reply({
        content: 'message ได้ถูกสร้างและส่งเรียบร้อยแล้ว!',
        flags: ApplicationFlags.ApplicationAutoModerationRuleCreateBadge
    });
}