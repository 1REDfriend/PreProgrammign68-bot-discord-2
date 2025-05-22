const { ButtonInteraction } = require("discord.js");
const Component = require("../../structure/Component");
const DiscordBot = require("../../client/DiscordBot");
const { info } = require("../../utils/Console");

module.exports = new Component({
    customId: "cancel-ticket",
    type: "button",
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ButtonInteraction} interaction 
     */
    run: async (client, interaction) => {
        info(`[${interaction.guild.name}] ${interaction.user.username} กำลังยกเลิกตั๋ว ${interaction.message.embeds[0].title}`)
        await interaction.message.delete();
    }
}).toJSON();
