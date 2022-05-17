const { Client, Collection } = require("discord.js");
const client = new Client({ intents: 32767 });
const { Warning, Error, Success } = require("../Utilites/Logger");
const { BOT_TOKEN } = require("./config.json");
const { promisify } = require("util");
const { glob } = require("glob");
const PG = promisify(glob);
const { AsciiTable3 } = require("ascii-table3");

//===========================================================

client.db = require("quick.db");

//===========================================================

client.commands = new Collection();
client.buttons = new Collection();

//===========================================================

["Events", "Commands", "Buttons"].forEach(handler => {
    require(`./Handlers/${handler}`)(client, PG, AsciiTable3);
});

//===========================================================

// Anti-Crash and more...
process.on("unhandledRejection", (reason, p) => { Warning(
    '=== unhandled Rejection ==='.toUpperCase(),
    'Reason: ' + reason.stack ? String(reason.stack) : String(reason),
    '==========================='.toUpperCase());
});

process.on("uncaughtException", (err, origin) => { Error(
    '=== uncaught Exception ==='.toUpperCase(),
    'Exception: ' + err.stack ? err.stack : err,
    '==========================='.toUpperCase());
});

process.on('uncaughtExceptionMonitor', (err, origin) => { Error(
    '=== uncaught Exception Monitor ==='.toUpperCase());
});

process.on('beforeExit', (code) => { Warning(
    '======= before Exit ======='.toUpperCase(),
    'Code: ' + code,
    '==========================='.toUpperCase());
});

process.on('warning', (code) => { Warning(
    '========= warning ========='.toUpperCase(),
    'Code: ' + code,
    '==========================='.toUpperCase());
});

process.on('exit', (code) => { Warning(
    '========== exit =========='.toUpperCase(), 
    'Code: ' + code,
    '=========================='.toUpperCase());
});

process.on('multipleResolves', (type, promise, reason) => { Warning(
    '==== multiple Resolves ===='.toUpperCase(),
    type, promise, reason,
    '==========================='.toUpperCase());
});

//===========================================================


client.login(BOT_TOKEN).catch(() => {
    Error("[BOT] Invalid Bot Login Token.");
    process.exit();
});

//===========================================================


process.on("SIGINT", () => { 
    Success("SIGINT detected, exiting..."); 
    process.exit(); 
});