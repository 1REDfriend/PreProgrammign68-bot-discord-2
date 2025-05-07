const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");

const setupHandler = require("./Verifly/setup");
const preprogrammingHandler = require("./Verifly/preprogramming");
const changeNameHandler = require("./Verifly/change-name");

module.exports = new ApplicationCommand({
    command: {
        name: 'verify',
        description: 'Verify to PreProgramming 68',
        type: 1,
        options: [
            {
                name: 'setup',
                description: 'ตั้งค่าระบบยืนยันตัวตน (สำหรับแอดมิน)',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'role',
                        description: 'บทบาทที่จะให้หลังจากการยืนยันตัวตน',
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    },
                    {
                        name: 'log_channel',
                        description: 'ช่องสำหรับส่งบันทึกการยืนยันตัวตน',
                        type: ApplicationCommandOptionType.Channel,
                        required: false
                    }
                ]
            },
            {
                name: 'preprogramming',
                description: 'ยืนยันตัวตนกับ PreProgramming 68',
                type: ApplicationCommandOptionType.Subcommand
            },
            {
                name: 'change-name',
                description: 'เปลี่ยนชื่อสมาชิกตามบทบาท',
                type: ApplicationCommandOptionType.Subcommand,
                options: [
                    {
                        name: 'role',
                        description: 'บทบาทของสมาชิกที่ต้องการเปลี่ยนชื่อ',
                        type: ApplicationCommandOptionType.Role,
                        required: true
                    }
                ]
            }
        ],
    },
    options: [{
        cooldown: 5000
    }],
    /**
     *
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'setup') {
            return setupHandler(client, interaction);
        } else if (subcommand === 'preprogramming') {
            return preprogrammingHandler(client, interaction);
        } else if (subcommand === 'change-name') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                const noPermissionEmbed = new EmbedBuilder()
                    .setTitle('❌ ไม่มีสิทธิ์เข้าถึง')
                    .setDescription('คุณไม่มีสิทธิ์ใช้คำสั่งนี้ จำเป็นต้องมีสิทธิ์ในการจัดการเท่านั้นนะจ๊ะ')
                    .setColor(0xFF0000)
                    .setFooter({ text: 'Permission Denied' })
                    .setTimestamp();

                return interaction.reply({ embeds: [noPermissionEmbed], ephemeral: true });
            }
            return changeNameHandler(client, interaction);
        } else {
            const helpEmbed = new EmbedBuilder()
                .setTitle('คำสั่งยืนยันตัวตน')
                .setDescription('เลือกใช้คำสั่งย่อยต่อไปนี้:\n- `/verifly preprogramming` เพื่อยืนยันตัวตน')
                .setColor(0x3498DB)
                .setFooter({ text: 'Verification Help' })
                .setTimestamp();

            return interaction.reply({ embeds: [helpEmbed], ephemeral: true });
        }
    }
}).toJSON();
