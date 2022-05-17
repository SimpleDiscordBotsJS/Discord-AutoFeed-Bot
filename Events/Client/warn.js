const { Warning } = require("../../Utilites/Logger");

module.exports = {
    name: "warn",
    execute(error) {
        Warning(error)
    }
}