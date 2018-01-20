require('dotenv').config();

const Discord = require('discord.js');
const co = require('co');
const R = require('ramda');
const pify = require('pify');

const fsAsync = pify(require('fs'));
const mkdirpAsync = pify(require('mkdirp'));
const rimrafAsync = pify(require('rimraf'));

const fetchAllMessages = require('./fetch-messages').fetchAllMessages;

function textifyMessage(message) {
	if(message == null) return '<null??>';

	const baseLine = `[${message.createdAt.toISOString()}] <${message.author.username}> ${message.cleanContent}`;

	return baseLine +
		(message.editedAt == null ? '' : ` [edited ${message.editedAt.toISOString()}]`);
}

const bot = new Discord.Client();

co(function*() {
	yield bot.login(process.env['DISCORD_TOKEN']);

	console.log('Fetching messages...');

	const channelMessages = yield Promise.all(
		process.argv.slice(2)
		.map(cid => fetchAllMessages(
			bot.channels.get(cid)
		))
	);

	console.log('Time to persist...');

	yield rimrafAsync('logs');
	yield mkdirpAsync('logs');

	yield Promise.all(
		channelMessages
		.map(cmBundle => {
			return fsAsync.writeFile(
				`logs/${cmBundle.channel.id}-#${cmBundle.channel.name}.txt`,
				R.reverse(
					cmBundle.messages.map(textifyMessage)
				).join('\n')
			);
		})
	);	
})
.catch(err => console.error(err.stack))
.then(() => bot.destroy())
.then(() => process.exit(0));
