const { MessageEmbed } = require("discord.js");
const { Error } = require("../../Utilities/Logger");
const fetch = require("node-fetch");
const { TWITCH_FEED } = require("../../Structures/config.json");

module.exports = {
    name: "ready",
    async execute(client) {

        if(TWITCH_FEED.ENABLED == false) return;
        if(!TWITCH_FEED.CHANNEL_ID) return Error("[FEED][TWITCH] Channel ID not defined!");
        if(!TWITCH_FEED.CLIENT_ID) return Error("[FEED][TWITCH] Client ID not defined!");
        if(!TWITCH_FEED.CLIENT_SECRET) return Error("[FEED][TWITCH] Client secret key not defined!");

        getTwitchAuthorization();

        // ======================================================================== //

        function getTwitchAuthorization() {
            let url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_FEED.CLIENT_ID}&client_secret=${TWITCH_FEED.CLIENT_SECRET}&grant_type=client_credentials`;
        
            fetch(url, {
                method: "POST",
            }).then((res) => (res.json())).then((data) => { 
                return getStreams(data);
            });
        }
        
        // ======================================================================== //
        
        async function getStreams(authorizationObject) {
            const endpoint = `https://api.twitch.tv/helix/streams?user_login=${TWITCH_FEED.STREAMER_LOGIN}`;

            let { access_token, expires_in, token_type } = authorizationObject;

            if(!access_token) return Error("[FEED][TWITCH] Access token not defined!")
  
            token_type = token_type.substring(0, 1).toUpperCase() + token_type.substring(1, token_type.length);
        
            let authorization = `${token_type} ${access_token}`;
        
            let headers = {
                authorization,
                "Client-Id": TWITCH_FEED.CLIENT_ID,
            };
        
            fetch(endpoint, { headers }).then((res) => res.json()).then((data) => SendFeed(data));
        }

        // ======================================================================== //

        async function SendFeed(data) {
            if(client.db.fetch(`postedStreams`) === null || client.db.get(`postedStreams`) === null) client.db.set(`postedStreams`, 0);

            let post;
            try { post = data; } catch(e) { return Error(e); }
            if([null, undefined].includes(client.db.get(`postedStreams`))) client.db.set(`postedStreams`, 0);

            const channel = await client.channels.fetch(TWITCH_FEED.CHANNEL_ID)
            .catch(e => { return Error("[FEED][TWITCH] The specified channel could not be determined!") });
            if(!channel) return;

            if(post.data[0] == null) return setTimeout(getTwitchAuthorization, 1000 * 60 * 10);

            if(post != undefined && post.data != null && client.db.get(`postedStreams`) != post.data[0].id) {
                client.db.set(`postedStreams`, post.data[0].id);
                
                const Embed = new MessageEmbed().setColor("PURPLE").setTitle("📡 **Stream started**").setTimestamp()
                .setURL(`https://twitch.tv/${post.data[0].user_login}`).setDescription(`${post.data[0].title}`).addFields(
                    { name: "🎩__Streamer:__", value: `\`${post.data[0].user_name}\``, inline: true },
                    { name: "🎮__Game:__", value: `\`${post.data[0].game_name}\``, inline: true }
                ).setImage(`${post.data[0].thumbnail_url}`.replace(`{width}`, 1980).replace(`{height}`, 1080))
                .setFooter({ text: `Twitch Feed` });

                channel.send({ embeds: [Embed] }).then((m) => { if(m.crosspostable) m.crosspost() });
            }

            setTimeout(getTwitchAuthorization, 1000 * 60 * 10);
        }
    }
}