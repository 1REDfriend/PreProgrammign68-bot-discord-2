const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const config = require("../../config");
const { info, error } = require("../../utils/Console");

module.exports = new ApplicationCommand({
    command: {
        name: 'verifly',
        description: 'Verifly to PreProgramming 68',
        type: 1,
        options: [
            {
                name: 'email',
                description: 'Your KMITL email.',
                type: ApplicationCommandOptionType.String,
                required: true
            },
        ],
    },
    options: [{ cooldown: 5000 }],
    /**
     *
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const email = interaction.options.getString('email');

        if (!email.endsWith("@kmitl.ac.th")) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Please provide a valid KMITL email.')
                .setColor(0xFF0000)
                .setFooter({ text: 'Verification Error' })
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (!database) {
            console.error('Failed to initialize QuickYAML database.');
            return interaction.reply({ content: 'Database error.', flags: 64  });
        }

        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        // 
        // code now?
        // 

        const successEmbed = new EmbedBuilder()
            .setTitle('Verification Successful')
            .setDescription(`Email **${email}** has been verified successfully!`)
            .setColor(0x00FF00)
            .setFooter({ text: 'Verification Complete' })
            .setThumbnail(interaction.user.displayAvatarURL())
            .setTimestamp();

        return interaction.reply({ embeds: [successEmbed], flags: 64 });
    }
}).toJSON();
