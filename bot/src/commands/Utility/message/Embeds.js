const { ChatInputCommandInteraction, ApplicationFlags } = require('discord.js');
const DiscordBot = require('../../../client/DiscordBot');

module.exports = {
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction 
     */
    async execute(client, interaction) {
        const title = interaction.options.getString('title', true);
        const description = interaction.options.getString('description') || '';
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const attachment = interaction.options.getAttachment('attachment');
        const colorHex = interaction.options.getString('color') || '#ffffff';

        const embed = {
            title,
            description,
            color: parseInt(colorHex.replace('#', ''), 16)
        };

        if (attachment) {
            embed.image = { url: attachment.url };
        }

        await channel.send({ embeds: [embed] });

        await interaction.reply({
            content: 'Embed ได้ถูกสร้างและส่งเรียบร้อยแล้ว!',
            flags: ApplicationFlags.ApplicationAutoModerationRuleCreateBadge
        });
    }
};
