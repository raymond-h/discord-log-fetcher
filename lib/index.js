const Discord = require('discord.js');
const co = require('co');
const R = require('ramda');
const pify = require('pify');

const fsAsync = pify(require('fs'));
const mkdirpAsync = pify(require('mkdirp'));
const rimrafAsync = pify(require('rimraf'));

function delay(ms, value) {
	return new Promise(resolve => setTimeout(resolve, ms, value));
}

const fetchAllMessages = co.wrap(function*(textChannel) {
	if(textChannel.lastMessageID == null) {
		return { channel: textChannel, messages: [] };
	}

	let lastMessageId = null;
	const out = [];

	while(true) {
		const messages = yield textChannel.fetchMessages({
			limit: 100,
			before: lastMessageId
		});

		console.log(`#${textChannel.name} @ ${textChannel.guild.name}: fetched ${messages.array().length} messages`);

		if(messages.array().length === 0) break;

		out.push(...messages.array());

		lastMessageId = R.last(messages.array()).id;

		yield delay(200 + Math.random() * 200);
	}

	console.log(`#${textChannel.name} @ ${textChannel.guild.name}: total: ${out.length} messages`);

	return { channel: textChannel, messages: out };
});

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

	const channelMessages = [];
	for(const cid of process.argv.slice(2)) {
		console.log('Fetching from', cid);

		const res = yield fetchAllMessages(
			bot.channels.get(cid)
		);

		channelMessages.push(res);
	}

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
.then(() => bot.destroy());
