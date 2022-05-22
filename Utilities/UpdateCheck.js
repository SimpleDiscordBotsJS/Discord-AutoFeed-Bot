// Проверка обновления на репозитории
const fetch = require("node-fetch");
const { version } = require("../package.json");
const { Info, Error } = require("./Logger");
module.exports = function UpdateCheck() {
    Info(`Current version : ${version}`);
    fetch("https://raw.githubusercontent.com/SimpleDiscordBotsJS/Discord-Template-Bot/main/package.json")
    .then((res) => res.json()).then((data) => {
        if(data.version !== version) {
            Info("============================== Update Available ==================================");
            Info("Version: " + data.version);
            Info("Check commit : https://github.com/SimpleDiscordBotsJS/Discord-Template-Bot/commits/main");
            // Info("Use 'npm run updatebot' to update");
            Info("==================================================================================");
        } else { Info("No Update Available") }})
    .catch((err) => { Error(err) });
}