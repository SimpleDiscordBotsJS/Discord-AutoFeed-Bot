const { Error } = require("../../Utilities/Logger");

module.exports = {
    name: "error",
    execute(error) {
        Error(error);
    }
}