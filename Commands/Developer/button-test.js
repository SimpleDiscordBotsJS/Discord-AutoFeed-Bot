const { CommandInteraction, MessageActionRow, MessageButton } = require("discord.js");

module.exports = {
    name: "button-test",
    nameLocalizations: {
        "ru": "тестовые-кнопкии"
    },
    description: "Spawn test button",
    descriptionLocalizations: {
        "ru": "Отправить тестовые кнопки"
    },
    permission: "ADMINISTRATOR",
    /**
     * @param {CommandInteraction} interaction 
     */
    execute(interaction) {
        interaction.reply({content: "Test button!", components: [new MessageActionRow()
            .addComponents(new MessageButton().setCustomId("test").setLabel("Test Button").setStyle("SUCCESS"))]});
    }
}