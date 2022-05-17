module.exports = async(client, PG, AsciiTable3) => {
    const Table = new AsciiTable3("Buttons Handler");

    (await PG(`${(process.cwd().replace(/\\/g, '/'))}/Buttons/**/*.js`)).map(async (file) => {
        const buttonFile = require(file);
        if(!buttonFile.id) return;

        client.buttons.set(buttonFile.id, buttonFile);
        Table.addRow(buttonFile.id, "✔ LOADED");
    });

    console.log(Table.toString());
}