require('dotenv').config();

const Discord = require('discord.js');

const createArchive = require('./index').createArchive;
const { progressBarStream } = require('./util');

function channelMatches(channel, name) {
	return channel.type === 'text' && (
		channel.name === name ||
		'#' + channel.name === name ||
		channel.id === name
	);
}

function allowAccess(member) {
	return member.id === process.env['DISCORD_OWNER_ID'] ||
		member.hasPermission(Discord.Permissions.FLAGS.ADMINISTRATOR);
}

async function main() {
	const bot = new Discord.Client();

	await bot.login(process.env['DISCORD_TOKEN']);

	bot.on('message', async msg => {
		try {
			if(!msg.isMentioned(bot.user) || msg.guild == null || !allowAccess(msg.member)) {
				return;
			}

			const match = /logs?\s+(.+)$/.exec(msg.cleanContent);

			if(match == null) {
				if(/help/.test(msg.cleanContent)) {
					await msg.reply([
						'**Usage**: `logs <channel name> [<channel name>...]`',
						'**Examples**: `logs #general`, `logs #general #games`',
						'The `#` is optional, and you can also specify channel IDs directly.',
						"Don't forget to also @-mention me when using commands!"
					]);
				}

				return;
			}

			const channels =
				match[1]
				.split(/\s+/)
				.map(str => str.trim())
				.map(str =>
					msg.guild.channels
					.find(chan => channelMatches(chan, str))
				)
				.filter(chan => chan != null);

			if(channels.length === 0) {
				msg.reply("You didn't specify any channels, or I didn't understand which ones you tried to specify!");
				return;
			}

			msg.reply(`Alright, I'll get the logs for channels ${channels.map(chan => '#' + chan.name).join(', ')}`);

			const archive = await createArchive(channels);

			const msgPromise = msg.reply('Here are the logs!', {
				files: [{
					name: 'logs.zip',
					attachment: archive
				}]
			});

			archive.finalize();

			await msgPromise;
		}
		catch(err) {
			console.error(err.stack);
			msg.reply(`Oh no, an error happened! ${err}`);
		}
	});
}

main()
.catch(err => {
	console.error(err.stack);
	setTimeout(() => process.exit(1), 200);
});
