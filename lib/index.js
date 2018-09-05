const fs = require('fs');

const pify = require('pify');
const bstream = require('bluestream');
const tempy = require('tempy');
const readReverse = require('fs-reverse');
const archiver = require('archiver');
const through2 = require('through2');

const fetchAllMessagesStream = require('./fetch-messages').fetchAllMessagesStream;
const { progressBarStream, textifyMessage } = require('./util');

async function createArchive(channels) {
	const archive = archiver('zip');

	archive.on('warning', function(err) {
		console.error(err.stack);
	});

	await Promise.all(
		channels
		.map(async chan => {
			const tmpFile = tempy.file();
			const outFile = `${chan.id}-#${chan.name}.txt`;
			console.log(`Writing '#${chan.name}' to file '${outFile}' (using ${tmpFile} as temp file)`);

			// fetch logs and write to temp file
			await bstream.pipe(
				fetchAllMessagesStream(chan),
				bstream.map(msg => JSON.stringify(textifyMessage(msg)) + '\n'),
				progressBarStream(`#${chan.name}, Discord -> tmp`),
				fs.createWriteStream(tmpFile)
			);

			const stats = await pify(fs).stat(tmpFile);

			// stream lines from temp file (in reverse order) into zip
			const logStream =
				readReverse(tmpFile)
				.pipe(
					// strip empty chunks and add newline to each chunk
					through2(function(chunk, enc, cb) {
						const buf = Buffer.from(chunk, enc);
						if(chunk.length > 0) {
							this.push(
								`${JSON.parse(buf.toString('utf8'))}\n`
							);
						}
						cb();
					})
				)
				.pipe(
					progressBarStream(`#${chan.name}, tmp -> zip`, stats.size)
				);

			archive.append(logStream, { name: outFile });
		})
	);

	return archive;
};

module.exports = { createArchive };
