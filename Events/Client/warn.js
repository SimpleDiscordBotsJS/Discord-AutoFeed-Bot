const { Warning } = require("../../Utilities/Logger");

module.exports = {
    name: "warn",
    execute(error) {
        Warning(error)
    }
}