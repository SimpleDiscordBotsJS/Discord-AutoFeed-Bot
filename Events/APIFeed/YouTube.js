const { Client } = require("discord.js");
const { YOUTUBE_FEED } = require("../../Structures/config.json");
const { Error, Info, Warning } = require("../../Utilities/Logger");
const Youtube = require("simple-youtube-api");
const RSSParser = require("rss-parser");
const parser = new RSSParser();

const startAt = Date.now();
const lastVideos = {};

const youtube = new Youtube(YOUTUBE_FEED.YOUTUBE_API_KEY);

module.exports = {
    name: "ready",
    /**
     * @param {Client} client 
     */
    async execute(client) {

        if(YOUTUBE_FEED.ENABLED === false) return Info("YouTube Feed - Disabled");

        check();
        setInterval(check, 15 * 1000); //15 seconds

        /**
         * Format a date to a readable string
         * @param {Date} date The date to format 
         */
        function formatDate(date) {
            let monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
            let day = date.getDate(), month = date.getMonth(), year = date.getFullYear();
            return `${day} ${monthNames[parseInt(month, 10)]} ${year}`;
        }

        /**
         * Call a rss url to get the last video of a youtuber
         * @param {string} youtubeChannelName The name of the youtube channel
         * @param {string} rssURL The rss url to call to get the videos of the youtuber
         * @returns The last video of the youtuber
         */
        async function getLastVideo(youtubeChannelName, rssURL){
            Info(`[${youtubeChannelName}] | Getting videos...`);
            let content = await parser.parseURL(rssURL);
            Info(`[${youtubeChannelName}] | ${content.items.length} videos found`);
            let tLastVideos = content.items.sort((a, b) => {
                let aPubDate = new Date(a.pubDate || 0).getTime();
                let bPubDate = new Date(b.pubDate || 0).getTime();
                return bPubDate - aPubDate;
            });
            Info(`[${youtubeChannelName}] | The last video is "${tLastVideos[0] ? tLastVideos[0].title : "err"}"`);
            return tLastVideos[0];
        }

        /**
         * Check if there is a new video from the youtube channel
         * @param {string} youtubeChannelName The name of the youtube channel to check
         * @param {string} rssURL The rss url to call to get the videos of the youtuber
         * @returns The video || null
         */
        async function checkVideos(youtubeChannelName, rssURL){
            Info(`[${youtubeChannelName}] | Get the last video..`);
            let lastVideo = await getLastVideo(youtubeChannelName, rssURL);
            // If there isn't any video in the youtube channel, return
            if(!lastVideo) return Error("[ERR] | No video found for " + lastVideo);
            // If the date of the last uploaded video is older than the date of the bot starts, return 
            if(new Date(lastVideo.pubDate).getTime() < startAt) return Info(`[${youtubeChannelName}] | Last video was uploaded before the bot starts`);
            let lastSavedVideo = lastVideos[youtubeChannelName];
            // If the last video is the same as the last saved, return
            if(lastSavedVideo && (lastSavedVideo.id === lastVideo.id)) return Info(`[${youtubeChannelName}] | Last video is the same as the last saved`);
            return lastVideo;
        }

        /**
        * Get the youtube channel id from an url
        * @param {string} url The URL of the youtube channel
        * @returns The channel ID || null
        */
        function getYoutubeChannelIdFromURL(url) {
            let id = null;
            url = url.replace(/(>|<)/gi, "").split(/(\/channel\/|\/user\/)/);
            if(url[2]) {
                id = url[2].split(/[^0-9a-z_-]/i)[0];
            }
            return id;
        }

        /**
        * Get infos for a youtube channel
        * @param {string} name The name of the youtube channel or an url
        * @returns The channel info || null
        */
        async function getYoutubeChannelInfos(name){
            Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | Resolving channel infos...`);
            let channel = null;
            /* Try to search by ID */
            let id = getYoutubeChannelIdFromURL(name);
            if(id) {
                channel = await youtube.getChannelByID(id);
            }

            if(!channel) {
                /* Try to search by name */
                let channels = await youtube.searchChannels(name);
                if(channels.length > 0) {
                    channel = channels[0];
                }
            }

            Info(`[${name.length >= 10 ? name.slice(0, 10)+"..." : name}] | Title of the resolved channel: ${channel.raw ? channel.raw.snippet.title : "err"}`);
            return channel;
        }

        /**
        * Check for new videos
        */
        async function check(){
            Info("Checking...");
            YOUTUBE_FEED.YOUTUBE_CHANNELS.forEach(async (youtuber) => {
                Info(`[${youtuber.length >= 10 ? youtuber.slice(0, 10) + "..." : youtuber}] | Start checking...`);
                let channelInfos = await getYoutubeChannelInfos(youtuber);
                if(!channelInfos) return Error("[ERR] | Invalid youtuber provided: " + youtuber);
                let video = await checkVideos(channelInfos.raw.snippet.title, "https://www.youtube.com/feeds/videos.xml?channel_id=" + channelInfos.id);
                if(!video) return Warning(`[${channelInfos.raw.snippet.title}] | No notification`);
                let channel = client.channels.cache.get(YOUTUBE_FEED.DISCORD_CHANNEL_ID);
                if(!channel) return Error("[ERR] | Channel not found");
                channel.send({ content: 
                    YOUTUBE_FEED.MESSAGE
                    .replace("{videoURL}", video.link)
                    .replace("{videoAuthorName}", video.author)
                    .replace("{videoTitle}", video.title)
                    .replace("{videoPubDate}", formatDate(new Date(video.pubDate)))
                });

                Info("Notification sent !");
                lastVideos[channelInfos.raw.snippet.title] = video;
            });
        }
    }
}