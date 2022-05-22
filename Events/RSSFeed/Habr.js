const { MessageEmbed } = require("discord.js");
const { Error } = require("../../Utilities/Logger");
const { HABR_FEED } = require("../../Structures/config.json");
const Parser = require("rss-parser");
const posts = new Parser();

module.exports = {
    name: "ready",
    async execute(client) {

        if(HABR_FEED.ENABLED == false) return;
        if(!HABR_FEED.CHANNEL_ID) return Error("[FEED][HABR] Channel ID not defined!");;

        checkOneHour();
        
        async function checkOneHour() {
            
            // ======================================================================== //

            if([null, undefined].includes(client.db.get(`habr_last_post_id`))) client.db.set(`habr_last_post_id`, 0);
            let feed = await posts.parseURL(`http://habrahabr.ru/rss/news`);

            const channel = await client.channels.fetch(HABR_FEED.CHANNEL_ID)
            .catch(e => { return Error("[FEED][HABR] The specified channel could not be determined!") });
            if(!channel) return;
            
            feed.items.reverse().forEach(async (item) => {
                const id = item.guid.match(/\d/g).join("");
                if(client.db.get(`habr_last_post_id`) < parseInt(id)) {
                    client.db.set(`habr_last_post_id`, parseInt(id));
                    
                    const Embed = new MessageEmbed()
                        .setTitle(item.title)
                        .setDescription(item.contentSnippet)
                        .setURL(item.guid)
                        .setColor("ORANGE");
                        
                    channel.send({ embeds: [Embed] }).then((m) => {
                        if(m.crosspostable) m.crosspost();
                        m.startThread({ name: `${item.title.substring(0, 50)}...`});
                    });
                }
            });
            
            // ======================================================================== //
            
            setTimeout(checkOneHour, 1000 * 60 * 60);
        }
    }
}