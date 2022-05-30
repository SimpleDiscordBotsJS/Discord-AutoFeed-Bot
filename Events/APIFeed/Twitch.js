const { Client, MessageEmbed } = require("discord.js");
const TwitchAPI = require("node-twitch").default;
const { TWITCH_FEED } = require("../../Structures/config.json");
const { Info, Warning, Error } = require("../../Utilities/Logger");

module.exports = {
    name: "ready",
    /**
     * @param {Client} client 
     */
    async execute(client) {

        if(TWITCH_FEED.ENABLED === false) return;

        if(!TWITCH_FEED.TWITCH_CLIENT_ID || TWITCH_FEED.TWITCH_CLIENT_ID == "YOUR_TWITCH_CLIENT_ID")
        return Warning("[FEED][TWITCH] Client ID not defined!");
        
        if(!TWITCH_FEED.TWITCH_CLIENT_SECRET_KEY || TWITCH_FEED.TWITCH_CLIENT_SECRET_KEY == "YOUR_TWITCH_CLIENT_SECRET_KEY")
        return Warning("[FEED][TWITCH] Client secret key not defined!");

        if(!TWITCH_FEED.DISCORD_CHANNEL_ID || TWITCH_FEED.DISCORD_CHANNEL_ID == "YOUR_DISCORD_CHANNEL_ID")
        return Warning("[FEED][TWITCH] Channel ID not defined!");

        const twitch = new TwitchAPI({
            client_id: TWITCH_FEED.TWITCH_CLIENT_ID,
            client_secret: TWITCH_FEED.TWITCH_CLIENT_SECRET_KEY,
            scopes: ["user:read:email"],
        });

        check();
        setInterval(check, 15 * 1000); // 15 seconds

        /**
         * Call a database to get the last stream id
         * @param {string} twitchChannelName The name of the twitch channel
         * @param {Object} channelInfo Stream Information
         * @returns The last stream of the streamer
         */
        async function getLastStream(twitchChannelName, channelInfo) {
            // If the streamer is not found in the database, create it
            if([null, undefined].includes(client.db.get(`twitch_${twitchChannelName}_last_stream_id`))) {
                client.db.set(`twitch_${twitchChannelName}_last_stream_id`, 0);
            }
            Info(`[${twitchChannelName}] | Getting streams...`);
            let idInDataBase = client.db.get(`twitch_${twitchChannelName}_last_stream_id`);
            // We write if there was a stream before
            if(idInDataBase === 0) Info(`[${twitchChannelName}] | last stream not found`);
            else Info(`[${twitchChannelName}] | last stream found`);
            // If the stream is new, we write it to the database
            if(channelInfo.id !== idInDataBase) {
                client.db.set(`twitch_${twitchChannelName}_last_stream_id`, channelInfo.id);
            }
            return idInDataBase;
        }

        /**
         * Check if there is a new stream from the twitch channel
         * @param {string} twitchChannelName The name of the twitch channel to check
         * @param {Object} channelInfo Stream Information
         * @returns The stream || null
         */
        async function checkStream(twitchChannelName, channelInfo) {
            Info(`[${twitchChannelName}] | Get the last stream..`);
            let lastStream = await getLastStream(twitchChannelName, channelInfo);
            // If the stream is the same as the last one, return
            if(lastStream === channelInfo.id) return Info(`[${twitchChannelName}] | Stream is still on`);
            return channelInfo;
        }

        /**
        * Get the twitch channel id from an url
        * @param {string} url The URL of the twitch channel
        * @returns The channel ID || null
        */
        async function getTwitchStreamerIdFromURL(url) {
            let id = null;
            url = url.replace(/(>|<)/gi, "").split(/https:\/\/(?:clips|www)\.twitch\.tv\/(?:(?:[a-z])\/clip\/)?([a-zA-Z]+)/);
            if(url[1]) {
                const data = (await twitch.getUsers(url[1])).data[0];
                id = data.id;
            }
            return id;
        }

        /**
        * Get infos for a twitch channel
        * @param {string} name The name of the twitch channel or an url
        * @returns The channel info || null
        */
        async function getTwitchChannelInfos(name) {
            Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | Resolving channel infos...`);
            let channel = null;
            /* Try to search by ID */
            let id = await getTwitchStreamerIdFromURL(name);
            if(id) {
                const data = await twitch.getStreams({ channel: id });
                if(data.data.length === 0)
                return Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | No data available. Maybe the streamer has stopped streaming...`);
                channel = data.data[0];
            }

            if(!channel) {
                /* Try to search by name */
                let channels = (await twitch.searchChannels({ query: name })).data;
                if(channels.length > 0) {
                    const data = await twitch.getStreams({ channel: id });
                    if(data.data.length === 0)
                    return Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | No data available. Maybe the streamer has stopped streaming...`);
                    channel = data.data[0];
                }
            }

            Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | Title of the resolved channel: ${channel.user_name ? channel.user_name : "err"}`);
            return channel;
        }

        /**
        * Check for new streams
        */
        async function check() {
            Info("Checking...");
            TWITCH_FEED.STREAMERS.forEach(async (streamer) => {
                Info(`[${streamer.length >= 10 ? streamer.slice(0, 10) + "..." : streamer}] | Start checking...`);
                // We get information about the streamer
                let channelInfos = await getTwitchChannelInfos(streamer);
                if(!channelInfos) return Error("[ERR] | Invalid streamer provided: " + streamer);
                // Checks if there are streams
                let stream = await checkStream(channelInfos.user_name, channelInfos);
                if(!stream) return Info(`[${channelInfos.user_name}] | No notification`);
                // Checks if a channel exists
                let channel = client.channels.cache.get(TWITCH_FEED.DISCORD_CHANNEL_ID);
                if(!channel) return Error("[ERR] | Channel not found");
                // Check if the bot has permission to send messages in this channel
                let perms = client.guilds.cache.find(guild => guild.id).me.permissionsIn(channel).has(["SEND_MESSAGES"]);
                if(!perms) return Error("[ERR] | The bot in this channel does not have permissions: SEND_MESSAGES");

                const Embed = new MessageEmbed().setColor("PURPLE").setTitle("📡 **Stream started**").setTimestamp()
                .setURL(`https://twitch.tv/${channelInfos.user_login}`).setDescription(`${stream.title}`).addFields(
                    { name: "🎩__Streamer:__", value: `\`${channelInfos.user_name}\``, inline: true },
                    { name: "🎮__Game:__", value: `\`${channelInfos.game_name}\``, inline: true }
                ).setImage(`${channelInfos.thumbnail_url}`.replace(`{width}`, 1980).replace(`{height}`, 1080))
                .setFooter({ text: `Viewers: ${channelInfos.viewer_count}` });

                channel.send({ embeds: [Embed] });

                Info("Notification sent !");
            });
        }
    }
}