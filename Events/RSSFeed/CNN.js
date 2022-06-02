const { MessageEmbed } = require("discord.js");
const { Error } = require("../../Utilities/Logger");
const { CNN_FEED } = require("../../Structures/config.json");
const Parser = require("rss-parser");
const posts = new Parser();

module.exports = {
    name: "ready",
    async execute(client) {
        
        if(CNN_FEED.ENABLED == false) return Info("[FEED][CNN] - Disabled");
        if(!CNN_FEED.DISCORD_CHANNEL_ID) return Error("[FEED][CNN] Channel ID not defined!");;

        checkOneHour();
        
        async function checkOneHour() {

            // ======================================================================== //

            if([null, undefined].includes(await client.db.get(`cnn_last_post_id`))) await client.db.set(`cnn_last_post_id`, 0);
            let feed = await posts.parseURL(`http://rss.cnn.com/rss/edition_technology.rss`);

            const channel = await client.channels.fetch(CNN_FEED.DISCORD_CHANNEL_ID)
            .catch(e => { return Error("[FEED][CNN] The specified channel could not be determined!") });
            if(!channel) return;
            
            feed.items.reverse().forEach(async (item) => {
                const id = item.guid.match(/\d/g).join("");
                if(await client.db.get(`cnn_last_post_id`) < parseInt(id)) {
                    await client.db.set(`cnn_last_post_id`, parseInt(id));
                    
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