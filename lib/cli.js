require('dotenv').config();
const fs = require('fs');

const Discord = require('discord.js');
const bstream = require('bluestream');

const createArchive = require('./index').createArchive;
const { progressBarStream } = require('./util');

const bot = new Discord.Client();

async function main() {
	await bot.login(process.env['DISCORD_TOKEN']);

	const archive = await createArchive(
		process.argv.slice(2)
		.map(cid => bot.channels.get(cid))
	);

	const donePromise = bstream.pipe(
		archive,
		progressBarStream('final zip file'),
		fs.createWriteStream('out.zip')
	);

	console.log('Finalizing...');
	archive.finalize();

	console.log('Waiting...');
	await donePromise;

	console.log('DONE!!');
}

main()
.catch(err => console.error(err.stack))
.then(() => bot.destroy())
.then(() => process.exit(0));
