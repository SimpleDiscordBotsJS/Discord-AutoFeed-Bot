const { DEBUG_EVENT } = require("../../Structures/config.json");
const { Debug } = require("../../Utilites/Logger");

module.exports = {
    name: "debug",
    execute(message) {
        if(DEBUG_EVENT == true) Debug(message);
    }
}