const { Client, CommandInteraction, MessageEmbed } = require("discord.js");

module.exports = {
    name: "interactionCreate",
    /**
     * @param {CommandInteraction} interaction 
     * @param {Client} client 
     */
    async execute(interaction, client) {
        if(interaction.isCommand()) {
            const command = client.commands.get(interaction.commandName);
            if(!command) return interaction.reply({embeds: [new MessageEmbed().setColor("RED")
                .setDescription("⛔ An error occured while running this command.")
            ]}) && client.commands.delete(interaction.commandName);
            
            // PERMISSION CHECK //

            if(command.permission && !interaction.member.permissions.has(command.permission)) {
                return interaction.reply({embeds: [new MessageEmbed().setColor("RED")
                    .setDescription(`You do not have permission to use this command: \`${interaction.commandName}\``)], 
                ephemeral: true });
            }

            //==================================================

            command.execute(interaction, client);
        }
    }
}