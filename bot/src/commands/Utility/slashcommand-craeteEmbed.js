const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

module.exports = new ApplicationCommand({
    command: {
        name: 'createembed',
        description: 'Create an embed message in a specified channel.',
        type: 1,
        options: [
            {
                name: 'channel',
                description: 'The channel to send the embed to.',
                type: ApplicationCommandOptionType.Channel,
                required: true
            },
            {
                name: 'title',
                description: 'The title of the embed.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
            {
                name: 'description',
                description: 'The description of the embed.',
                type: ApplicationCommandOptionType.String,
                required: true
            }
        ]
    },
    options: {
        cooldown: 5000,
        botDevelopers: true,
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        // ดึงข้อมูลจาก Options
        const channel = interaction.options.getChannel('channel');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');

        // ตรวจสอบว่าเป็น Text Channel หรือไม่
        if (!channel.isTextBased()) {
            return interaction.reply({
                content: 'The selected channel is not a text-based channel.',
                ephemeral: true
            });
        }

        // สร้าง Embed
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(0x00AE86) // สีของ Embed
            .setTimestamp();

        try {
            // ส่ง Embed ไปที่ Channel
            await channel.send({ embeds: [embed] });

            // ตอบกลับผู้ใช้
            await interaction.reply({
                content: `Embed successfully sent to ${channel}!`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Failed to send the embed. Please check bot permissions.',
                ephemeral: true
            });
        }
    }
}).toJSON();
