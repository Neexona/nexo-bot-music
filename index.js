'use strict';
const Discord = require('discord.js');

const cmds = require('./commands.js');
const music = require('./music.js');
const tool = require('./tool.js');
const prefix = 'a!';

const prompt = require('prompt');
const colors = require('colors');
prompt.message = '';
prompt.delimiter = '';

const bot = new Discord.Client();

bot.on('ready', () => {
    console.log(`${bot.user.username}  lancé.`);
    console.log(`Activé dans le serveur ${bot.guilds.size}.`);

    bot.user.setGame(prefix + 'help pour avoir un coup de main');


    //Internal bot commands.
});

bot.on('message', msg => {
    if (msg.author.bot || msg.channel.type != 'text')
        return; // Do not respond to messages from bots or messages that are not from guilds.

    if (!msg.content.startsWith(prefix))
        return; //Not a command.

    let cmd = msg.content.split(/\s+/)[0].slice(prefix.length).toLowerCase();
    getCmdFunction(cmd)(msg);
});

bot.on('error', (e) => console.error(e));
bot.on('warn', (e) => console.warn(e));
// bot.on('debug', (e) => console.info(e));

bot.login(process.env.TOKEN);

function getCmdFunction(cmd) {
    const COMMANDS = {
	    'ban': cmds.ban,
        'choose': cmds.choose,
        'help': cmds.help,
        'debug': cmds.debug,
        'kick': cmds.kick,
        'prune': cmds.prune,
        'music': music.processCommand,
    }
    return COMMANDS[cmd] ? COMMANDS[cmd] : () => {};
}

exports.setYoutubeKey = function(key) {
	yt_api_key = (process.env.YT_API_KEY);
}



