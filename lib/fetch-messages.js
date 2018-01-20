const bstream = require('bluestream');
const getStream = require('get-stream');

const last = arr => arr[arr.length - 1];

function fetchAllMessagesGenericStream(fetch) {
	let lastMessageId = null
	let msgCount = 0

	return bstream.read(async function() {
		const messages = await fetch(lastMessageId);
		msgCount += messages.length

		if(messages.length === 0) return null;

		for(const msg of messages) {
			await this.push(msg);
		}

		lastMessageId = last(messages).id;
	});
}

function fetchAllMessagesStream(textChannel) {
	function fetch(lastMessageId) {
		return textChannel.fetchMessages({
			limit: 100,
			before: lastMessageId
		})
		.then(col => col.array());
	}

	return fetchAllMessagesGenericStream(fetch);
};

module.exports = { fetchAllMessagesGenericStream, fetchAllMessagesStream };
