const { Client } = require("discord.js");
const { Success } = require("../../Utilities/Logger");
const UpdateCheck = require("../../Utilities/UpdateCheck");

module.exports = {
    name: "ready",
    once: true,
    /**
     * @param {Client} client 
     */
    execute(client) {
        UpdateCheck();
        Success(`✅ Запущен от имени бота: ${client.user.tag}!`);
        client.user.setActivity("Werry nice stream", {type: "STREAMING"});
    }
}