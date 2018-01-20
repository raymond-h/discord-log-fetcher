const progressStream = require('progress-stream');

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

module.exports = { progressBarStream, textifyMessage };
