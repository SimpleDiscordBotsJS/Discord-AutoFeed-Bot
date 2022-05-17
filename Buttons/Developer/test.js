module.exports = {
    id: "test",
    permission: "ADMINISTRATOR",
    async execute(interaction) {
        interaction.reply({content: "Test!", ephemeral: true});
    }
}