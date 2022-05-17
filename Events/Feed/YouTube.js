const { YOUTUBE_CHANNEL_ID } = require("../../Structures/config.json");
const Parser = require("rss-parser");
const posts = new Parser();

module.exports = {
    name: "ready",
    async execute(client) {
        checkOneHour();
        
        async function checkOneHour() {
            
            // ======================================================================== //

            if([null, undefined].includes(client.db.get(`YTpostedVideos`))) client.db.set(`YTpostedVideos`, []);
            let youtube = await posts.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=UCG6QEHCBfWZOnv7UVxappyw`);
            
            youtube.items.reverse().forEach(async (item) => {
                if(!client.db.get(`YTpostedVideos`).includes(item.id)) {
                    client.db.push("YTpostedVideos", item.id);
        
                    const channel = await client.channels.fetch(YOUTUBE_CHANNEL_ID);
                    const message = `**{author}** published **{title}**!\n{url}`
                        .replace(/{author}/g, item.author)
                        .replace(/{title}/g, item.title.replace(/\\(\*|_|`|~|\\)/g, '$1').replace(/(\*|_|`|~|\\)/g, '\\$1'))
                        .replace(/{url}/g, item.link);
                    channel.send(message).then((m) => {
                        if(m.crosspostable) m.crosspost();
                    });
                }
            });
            
            // ======================================================================== //
        
            setTimeout(checkOneHour, 1000 * 60 * 60);
        }
    }
}