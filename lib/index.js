require('dotenv').config();

const Discord = require('discord.js');
const co = require('co');
const R = require('ramda');
const pify = require('pify');
const bstream = require('bluestream');
const tempy = require('tempy');
const readReverse = require('fs-reverse');
const archiver = require('archiver');
const pumpify = require('pumpify');
const progressStream = require('progress-stream');
const through2 = require('through2');

const fs = require('fs');
const fsAsync = pify(require('fs'));
const mkdirpAsync = pify(require('mkdirp'));
const rimrafAsync = pify(require('rimraf'));

const fetchAllMessages = require('./fetch-messages').fetchAllMessages;
const fetchAllMessagesStream = require('./fetch-messages').fetchAllMessagesStream;

function progressBarStream(prefix, length) {
	const str = progressStream({
		length: length || 0,
		time: 1000
	});

	str.on('progress', progress => {
		console.log(`${prefix}: ${progress.percentage.toFixed(1)}% done (ETA: ${progress.eta} seconds)`);
	});

	return str;
}

function textifyMessage(message) {
	if(message == null) return '<null??>';

	const baseLine = `[${message.createdAt.toISOString()}] <${message.author.username}> ${message.cleanContent}`;

	return baseLine +
		(message.editedAt == null ? '' : ` [edited ${message.editedAt.toISOString()}]`);
}

const createArchive = co.wrap(function*(channels) {
	const archive = archiver('zip');

	archive.on('warning', function(err) {
		console.error(err.stack);
	});

	yield Promise.all(
		channels
		.map(co.wrap(function*(chan) {
			const tmpFile = tempy.file();
			const outFile = `${chan.id}-#${chan.name}.txt`;
			console.log(`Writing '#${chan.name}' to file '${outFile}' (using ${tmpFile} as temp file)`);

			// fetch logs and write to temp file
			yield bstream.pipe(
				fetchAllMessagesStream(chan),
				bstream.map(msg => textifyMessage(msg) + '\n'),
				progressBarStream(`#${chan.name}, Discord -> tmp`),
				fs.createWriteStream(tmpFile)
			);

			const stats = yield fsAsync.stat(tmpFile);

			// stream lines from temp file (in reverse order) into zip
			const logStream = pumpify(
				readReverse(tmpFile),

				// strip empty chunks and add newline to each chunk
				through2(function(chunk, enc, cb) {
					const buf = Buffer.from(chunk, enc);
					if(chunk.length > 0) {
						this.push(
							Buffer.concat([buf, Buffer.from('\n')])
						);
					}
					cb();
				}),

				progressBarStream(`#${chan.name}, tmp -> zip`, stats.size)
			);

			archive.append(logStream, { name: outFile });
		}))
	);

	return archive;
});

const bot = new Discord.Client();

co(function*() {
	yield bot.login(process.env['DISCORD_TOKEN']);

	const archive = yield createArchive(
		process.argv.slice(2)
		.map(cid => bot.channels.get(cid))
	);

	const outStream = pumpify(
		archive,
		progressBarStream(`final zip file`),
		fs.createWriteStream('out.zip')
	);

	console.log('Finalizing...');
	archive.finalize();
	console.log('Waiting...');
	yield bstream.wait(outStream);
	console.log('DONE!!');
})
.catch(err => console.error(err.stack))
.then(() => bot.destroy())
.then(() => process.exit(0));
