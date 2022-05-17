const { Error } = require("../../Utilites/Logger");

module.exports = {
    name: "error",
    execute(error) {
        Error(error);
    }
}