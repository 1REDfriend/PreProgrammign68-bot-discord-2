const { Client, Collection, Partials, GatewayIntentBits, ButtonStyle } = require("discord.js");
const { database_sqlite_setup } = require("../utils/Database");

const { warn, error, info, success } = require("../utils/Console");
const config = require("../config");

const CommandsHandler = require("./handler/CommandsHandler");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const TrackUserListener = require("./handler/TrackUserListener");
const MemberApprovalHandler = require("./handler/MemberApprovalHandler");
const MemberApprovalListener = require("./handler/MemberApprovalListener");

class DiscordBot extends Client {
    collection = {
        commands: {
            application: new Collection(),
        },
        components: {
            buttons: new Collection(),
            regexButtons: new Collection(),
            selects: new Collection(),
            regexSelects: new Collection(),
            modals: new Collection(),
            regexModals: new Collection(),
            autocomplete: new Collection(),
        },
        memberRequests: new Collection(),
        application_commands: new Collection(),
        message_commands: new Collection(),
        message_commands_aliases: new Collection(),
    }
    rest_application_commands_array = [];
    login_attempts = 0;
    login_timestamp = 0;
    statusMessages = [
        { name: 'Pre', type: 4 },
        { name: 'PrePro', type: 4 },
        { name: 'PreProgramming', type: 4 },
        { name: 'PreProgramming 68', type: 4 },
        { name: 'PreProgramming 68', type: 4 },
    ]

    commands_handler = new CommandsHandler(this);
    components_handler = new ComponentsHandler(this);
    events_handler = new EventsHandler(this);
    memberApprovalHandler = new MemberApprovalHandler(this);

    buttonComponent = {
        /**
         * สร้างปุ่มกดสำหรับการโต้ตอบ
         * @param {string} customId - ID ของปุ่ม
         * @param {string} label - ข้อความบนปุ่ม
         * @param {string|number} style - รูปแบบของปุ่ม (Primary, Secondary, Success, Danger, Link) หรือค่าตัวเลข (1-5)
         * @param {string} emoji - อีโมจิสำหรับปุ่ม (ถ้ามี)
         * @returns {object} - ข้อมูลปุ่มสำหรับส่งไปยัง Discord API
         */
        createButton: (customId, label, style, emoji) => {
            // แปลง style จาก string เป็น number ตาม ButtonStyle
            if (typeof style === 'string') {
                switch (style.toLowerCase()) {
                    case 'primary':
                        style = ButtonStyle.Primary; // 1
                        break;
                    case 'secondary':
                        style = ButtonStyle.Secondary; // 2
                        break;
                    case 'success':
                        style = ButtonStyle.Success; // 3
                        break;
                    case 'danger':
                        style = ButtonStyle.Danger; // 4
                        break;
                    case 'link':
                        style = ButtonStyle.Link; // 5
                        break;
                    default:
                        style = ButtonStyle.Primary; // ค่าเริ่มต้น
                }
            }

            return {
                type: 2,
                custom_id: customId,
                label,
                style,
                emoji
            }
        },
        createRow: (buttons) => {
            return {
                type: 1,
                components: buttons
            }
        }
    };

    constructor(options) {
        super({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.DirectMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ],
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            presence: {
                activities: [{
                    name: '',
                    type: 4,
                    state: 'Preprogramming 68'
                }]
            }
        });

        new CommandsListener(this);
        new ComponentsListener(this);
        new TrackUserListener(this);
        new MemberApprovalListener(this);
    }

    startStatusRotation = () => {
        let index = 0;
        setInterval(() => {
            this.user.setPresence({ activities: [this.statusMessages[index]] });
            index = (index + 1) % this.statusMessages.length;
        }, 4000);
    }

    connect = async () => {
        warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);

        this.login_timestamp = Date.now();

        try {
            database_sqlite_setup
        } catch (e) {
            error(`database fail to connect: ${e}`)
        }

        try {
            await this.login(process.env.CLIENT_TOKEN);

            warn('Attempting to delete existing application commands...');
            await this.commands_handler.deleteApplicationCommands(config.development);
            success('Successfully deleted existing application commands');

            this.commands_handler.load();
            this.components_handler.load();
            this.events_handler.load();
            this.startStatusRotation();
            this.memberApprovalHandler.load();

            warn('Attempting to register application commands... (this might take a while!)');
            await this.commands_handler.registerApplicationCommands(config.development);
            success('Successfully registered application commands. For specific guild? ' + (config.development.enabled ? 'Yes' : 'No'));
        } catch (err) {
            error('Failed to connect to the Discord bot, retrying...');
            error(err);
            this.login_attempts++;
            setTimeout(this.connect, 5000);
        }
    }
}

module.exports = DiscordBot;
