const { Events } = require("../Validation/EventNames");

module.exports = async(client, PG, AsciiTable3) => {
    const Table = new AsciiTable3("Events Loaded");

    (await PG(`${(process.cwd().replace(/\\/g, '/'))}/Events/*/*.js`)).map(async (file) => {
        const event = require(file);

        if(!Events.includes(event.name) || !event.name) {
            const L = file.split("/");
            await Table.addRow(`${event.name || "MISSING"}`, `✘ Event name is either invalid or missing: ${L[L.length - 2]}/${L[L.length - 1]}`);
            return;
        }
        
        if(event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        };

        await Table.addRow(event.name, "✔ SUCCESSFUL")
    });

    console.log(Table.toString());
}