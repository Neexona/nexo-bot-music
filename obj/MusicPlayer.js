'use strict';
const tool = require('../tool.js');

/*
The music player for a guild.
Handles the queuing, and streaming of Songs.
*/
class MusicPlayer {
    constructor(guild) {
        this.queue = [];
        this.musicChannel = null;
        this.voiceConnection = null;
        this.dispatch = null;
        this.volume = 1;
        this.status = 'offline'; //States: offline, playing, stopped
        this.inactivityTimer = 60;
    }

    /*
    Adds the song to the queue.
    If an index argument is included, insert the song at that index instead of pushing it to the queue.

    @param {Object} song The song to queue.
    @param {Number} [index] The index to insert the song at.
    */
    queueSong(song) {
        let index;
        if (arguments.length == 2)
            index = arguments[1];
        if (index != undefined) {
            this.queue[index] = song;
        } else {
            this.queue.push(song);
        }
    }

    /*
    A recursive function that plays the queue.
    */
    playSong(msg) {
        if (this.queue.length === 0) {
            this.musicChannel.send('Queue arrêté.');
            this.changeStatus('stopped');
        } else {
            resolveVoiceChannel.call(this).then(() => {
                let song = this.queue[0];
                let stream = song.getStream();
                console.log(song.thumbnail);
                this.musicChannel.send({embed: {
                    color: 3447003,
                    fields: [{
                        name: `Actuellement joué : `,
                        value: `[${song.title}]`+`(${song.url}) (\`${song.time}\`) demandé par **${song.author}**`
                      }],
                    thumbnail: {
                        url: `${song.thumbnail}`
                    },
                    timestamp: new Date(),
                    footer: {
                      icon_url: msg.author.avatarURL,
                      text: "© Silver Crow"
                    }
                  }
                });
                this.changeStatus('playing');
                this.dispatch = this.voiceConnection.playStream(stream, {
                    passes: 2,
                    volume: this.volume
                });

                this.dispatch.on('error', error => {
                    this.dispatch = null;
                    this.queue.shift();
                    this.playSong(msg);
                });

                this.dispatch.on('end', reason => {
                    this.dispatch = null;
                    this.queue.shift();
                    if (reason != 'leave') {
                        this.playSong(msg);
                    }
                });

                this.dispatch.on('debug', info => {
                    console.log(info);
                });
            }).catch(err => {
                if (err != 'novoice') console.log(err);
            });
        }

        /*
        Resolves the voice channel.
        @return Promise - resolved if the bot is connected to a voice channel, and rejected if not.
        */
        function resolveVoiceChannel() {
            return new Promise((resolve, reject) => {
                if (this.voiceConnection)
                    resolve();
                else {
                    msg.channel.send(
                        `S'il vous plaît appelez-moi en utilisant ${tool.wrap('+music join')} pour commencer à jouer la queue.`
                    );
                    reject('novoice');
                }
            });
        }
    }

    /*
    Skips the current song.
    */
    skipSong() {
        if (this.dispatch && this.status == 'playing') {
            this.musicChannel.send(`Skippé ${tool.wrap(this.queue[0].title)}`);
            this.dispatch.end();
        } else {
            this.musicChannel.send(`Il n'y a rien à skip !`);
        }
    }

    /*
    Pauses the dispatcher.
    */
    pauseSong() {
        if (this.dispatch)
            this.dispatch.pause();
        else
            this.musicChannel.send(`Rien n'est joué en ce moment.`);
    }

    /*
    Resumes the dispatcher.
    */
    resumeSong() {
        if (this.dispatch)
            this.dispatch.resume();
        else
            this.musicChannel.send(`Rien n'est joué en ce moment.`);

    }

    /*
    Prints the queue.
    */
    printQueue(msg) {
        if (this.queue.length > 0) {
            try {
                let queueString = '';
                for (let i = 0; i < this.queue.length && i < 15; i++)
                    queueString += `${i + 1}. ${this.queue[i].title} (\`${this.queue[i].time}\`) demandé par ${this.queue[i].author}\n`;
                if (this.queue.length > 15)
                    queueString += `\nand ${this.queue.length - 15} more.`;
                msg.channel.send(queueString, {
                    'code': true
                });
            } catch (err) {
                console.log('ERROR CAUGHT:\n' + err);
                msg.channel.send(
                    `${tool.inaError} Gomen, je ne peux pas afficher la queue maintenant. Réessayez dans quelques instants onegai.`
                );
            }
        } else {
            msg.channel.send(`Il n'y a pas de musique dans la queue !`);
        }
    }

    /*
    Clears the queue.
    */
    purgeQueue(msg) {
        this.queue = [];
        msg.channel.send('La queue à été éffacée.');
    }

    /*
    Displays the currently playing song.
    */
    nowPlaying(msg) {
        if (this.queue.length > 0){
            msg.channel.send({embed: {
                    color: 3447003,
                    fields: [{
                        name: `Maintenant joué :`,
                        value: `[${this.queue[0].title}]`+`(${this.queue[0].url}) (\`${this.queue[0].time}\`) requested by **${this.queue[0].author}**`
                      }],
                    thumbnail: {
                        url: `${this.queue[0].thumbnail}`
                    },
                    timestamp: new Date(),
                    footer: {
                      icon_url: msg.author.avatarURL,
                      text: "© Silver Crow"
                    }
                  }
                });
        }else{
            msg.channel.send(`Rien n'est joué en ce moment.`);
        }
    }

    /*
    Sets the volume of the dispatcher.
    */
    setVolume(msg) {
        let vol = parseInt(msg.content.split(/\s+/)[2]) / 100;
        if (vol && (vol >= 0 && vol <= 1)) {
            if (this.dispatch) {
                this.dispatch.setVolume(vol);
                this.volume = vol;
                msg.channel.send(`Volume réglé à ${tool.wrap(vol * 100)}`);
            } else {
                msg.channel.send(`Rien n'est joué en ce moment.`);
            }
        } else {
            msg.channel.send(`Utilisez un nombre entre 0 et 100 !`);
        }
    }

    /*
    Summons the bot to the user's voice channel.
    */
    joinVc(msg) {
        if (msg.member.voiceChannel) {
            this.musicChannel = msg.channel;
            msg.member.voiceChannel.join().then(connection => {
                this.voiceConnection = connection;
                this.musicChannel.send(
                    `J'ai rejoins : **${msg.member.voiceChannel.name}** et #**${this.musicChannel.name}**.`
                );
                this.changeStatus('stoppé');
                if (this.queue.length > 0)
                    this.playSong(msg);
            })
        } else {
            msg.channel.send(`Vous n'êtes pas dans un canal vocal !`);
        }
    }

    /*
    Disconnects from the voice channel.
    */
    leaveVc(msg) {
        if (this.voiceConnection) {
            this.musicChannel.send(`Leaving **${this.voiceConnection.channel.name}**.`);
            this.musicChannel = null;
            if (this.dispatch)
                this.dispatch.end('leave');
            this.voiceConnection.disconnect();

            this.changeStatus('offline');

            this.voiceConnection = null;
            this.dispatch = null;
        } else {
            msg.channel.send(`I'm not in a voice channel!`);
        }
    }

    /*
    Changes the status of the bot.
    @param {String} status The status to set the bot to.
    */
    changeStatus(status) {
        this.status = status;
        this.inactivityTimer = status == 'paused' ?
            600 :
            120;
    }
}

module.exports = MusicPlayer;



