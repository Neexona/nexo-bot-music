
'use strict';
const tool = require('./tool.js');
const ytdl = require('ytdl-core');
const ySearch = require("youtube-search");
const Song = require('./obj/Song.js');
const MusicPlayer = require('./obj/MusicPlayer.js');
const rp = require('request-promise');

module.exports.processCommand = processCommand;

let guilds = {};

function processCommand(msg) {
    if (!msg.guild.available) return;

    //Add guild to the guild list.
    if (!guilds[msg.guild.id])
        guilds[msg.guild.id] = new MusicPlayer();
    let guild = guilds[msg.guild.id];

    let musicCmd = msg.content.split(/\s+/)[1];
    if (musicCmd)
        musicCmd.toLowerCase();
    switch (musicCmd) {
        case 'play':
            return processInput(msg, guild);
        case 'skip':
            return guild.skipSong(msg);
        case 'pause':
            return guild.pauseSong();
        case 'resume':
            return guild.resumeSong();
        case 'queue':
            return guild.printQueue(msg);
        case 'np':
            return guild.nowPlaying(msg);
        case 'vol':
            return guild.setVolume(msg);
        case 'purge':
            return guild.purgeQueue(msg);

        case 'join':
            return guild.joinVc(msg);
        case 'leave':
            return guild.leaveVc(msg);
        default:
            msg.channel.send(`Renseignez vous avec ${tool.wrap('+help music')}.`);
    }
}


function processInput(msg, guild) {
    let url = msg.content.split(/\s+/).slice(2).join(' ');
    if (url) {
        if (!url.startsWith('http')) { //Assume its a search.
            processSearch(msg, guild, url);
        } else if (url.search('youtube.com')) { //Youtube.
            let playlist = url.match(/list=(\S+?)(&|\s|$|#)/); //Match playlist id.
            if (playlist) { //Playlist.
                processYoutube.playlist(msg, guild, playlist[1]);
            } else if (url.search(/v=(\S+?)(&|\s|$|#)/)) { //Video.
                processYoutube.song(msg, guild, url);
            } else {
                msg.channel.send(`Lien YouTube invalide !`);
            }
        } else if (url.search('soundcloud.com')) { //Soundcloud.
            msg.channel.send('Désolée, la musique de Soundcloud est pas fonctionnelle pour le moment.');
        } else {
            msg.channel.send('Désolée, je ne supporte que Youtube en ce moment.');
        }
    }
}

function processSearch(msg, guild, searchQuery) {
const opts = {
    maxResults: 3,
    key: process.env.YT_API_KEY
};
    ySearch(searchQuery, opts, function (err, results) {
        if (err) {
            msg.channel.send(`Désolée, je n'ai pas trouvé de chanson correspondante.`);
            return console.log(err);
        }
        for (var y = 0; results[y].kind === 'youtube#channel'; y++);
        ytdl.getInfo(results[y].link, function (err, song) {
            if (err) {
                msg.channel.send(`Désolée, je n'ai pas trouvé de chanson correspondante.`);
                return console.log(err);
            }
            const author  = msg.author.username + '#' + msg.author.discriminator;
            guild.queueSong(new Song(song.title, song.video_url, 'youtube',  author, time(song.length_seconds), song.iurlmq));
                    msg.channel.send(
            `Ajoutée à la queue ${tool.wrap(song.title.trim())} (\`${time(song.length_seconds)}\`) demandé par ${tool.wrap(author)}`
        );

        if (guild.status != 'playing')
            guild.playSong(msg, guild);
    
        });
    });
}

/*
Processing functions for Youtube links.
*/
const processYoutube = {
    /*
    Processes a Youtube song, pushing it to the queue.
    @param {String} url The URL of the new song.
    */
    song(msg, guild, url) {
        ytdl.getInfo(url, (err, song) => {
            if (err) {
                console.log(err);
                msg.channel.send(`Désolé, je ne pouvais pas mettre dans la queue votre musique.`);
                return;
            }
            const author  = msg.author.username + '#' + msg.author.discriminator;
            console.log(song);
            guild.queueSong(new Song(song.title, url, 'youtube', author,time(song.length_seconds), song.iurlmq));
            msg.channel.send(
                `Ajoutée à la queue ${tool.wrap(song.title.trim())} (\`${time(song.length_seconds)}\`) demandé par ${tool.wrap(author)}`
            );
            if (guild.status != 'playing') {
                guild.playSong(msg);
            }
        });
    },

    /*
    Processes a Youtube playlist.
    @param {String} playlistId The ID of the Youtube playlist.
    */
    playlist(msg, guild, playlistId) {
        const youtubeApiUrl = 'https://www.googleapis.com/youtube/v3/';

        Promise.all([getPlaylistName(), getPlaylistSongs([], null)])
            .then(results => addToQueue(results[0], results[1]))
            .catch(err => {
                console.log(err);
                msg.channel.send(
                    `Désolé, je n'ai pas pu ajouter votre playlist à la file d'attente. Réessayez plus tard.`
                )
            });

        async function getPlaylistName() {  
            let options = {
                url: `${youtubeApiUrl}playlists?id=${playlistId}&part=snippet&key=${yt_api_key}`
            }
            let body = await rp(options);
            let playlistTitle = JSON.parse(body).items[0].snippet.title;
            return playlistTitle;
        }



        async function getPlaylistSongs(playlistItems, pageToken) {
            pageToken = pageToken ?
                `&pageToken=${pageToken}` :
                '';

            let options = {
                url: `${youtubeApiUrl}playlistItems?playlistId=${playlistId}${pageToken}&part=snippet,contentDetails&fields=nextPageToken,items(snippet(title,resourceId/videoId,thumbnails),contentDetails)&maxResults=50&key=${yt_api_key}`
            }

            let body = await rp(options);
            let playlist = JSON.parse(body);
            playlistItems = playlistItems.concat(playlist.items.filter( //Concat all non-deleted videos.
                item => item.snippet.title != 'Deleted video'));

            if (playlist.hasOwnProperty('nextPageToken')) { //More videos in playlist.
                playlistItems = await getPlaylistSongs(playlistItems, playlist.nextPageToken);
            }

            return playlistItems;
        }


        async function addToQueue(playlistTitle, playlistItems) {
            let queueLength = guild.queue.length;
            const author  = msg.author.username + '#' + msg.author.discriminator;
            for (let i = 0; i < playlistItems.length; i++) {
                let song = new Song(
                    playlistItems[i].snippet.title,
                    `https://www.youtube.com/watch?v=${playlistItems[i].snippet.resourceId.videoId}`,
                    'youtube', author, "0:00", (playlistItems[i].snippet.thumbnails.medium.url || playlistItems[i].snippet.thumbnails.default.url));
                guild.queueSong(song, i + queueLength);
            }

            msg.channel.send(
                `Ajouté ${tool.wrap(playlistItems.length)} chansons de ${tool.wrap(playlistTitle)} demandé par ${tool.wrap(msg.author.username + '#' + msg.author.discriminator)}`
            );

            if (guild.status != 'playing') {
                guild.playSong(msg);
            }
        }
    },
}
/*
Parser time for video.
 */

function time(timesec){
        let upTimeOutput = "";
        if (timesec<60) {
            upTimeOutput = `${timesec}s`;
        } else if (timesec<3600) {
            upTimeOutput = `${Math.floor(timesec/60)}:${timesec%60}`;
        } else if (timesec<86400) {
            upTimeOutput = `${Math.floor(timesec/3600)}:${Math.floor(timesec%3600/60)}:${timesec%3600%60}`;
        } else if (timesec<604800) {
            upTimeOutput = `${Math.floor(timesec/86400)}:${Math.floor(timesec%86400/3600)}:${Math.floor(timesec%86400%3600/60)}:${timesec%86400%3600%60}`;
        }
        return upTimeOutput;
}


/*
Timer for inactivity. Leave voice channel after inactivity timer expires.
*/
function timer() {
    for (let guildId in guilds) {
        let guild = guilds[guildId];
        if (guild.status == 'stopped' || guild.status == 'paused')
            guild.inactivityTimer -= 10;
        if (guild.inactivityTimer <= 0) {
            guild.voiceConnection.disconnect();
            guild.voiceConnection = null;
            guild.musicChannel.send(
                `J'ai quitté le canal vocal en raison de l'inactivité.`);

            guild.changeStatus('offline');
        }
    }
}
setInterval(timer, 10000);



