const co = require('co');
const R = require('ramda');

const bstream = require('bluestream');
const getStream = require('get-stream');

const fetchAllMessagesGenericStream = function(fetch) {
	let lastMessageId = null
	let msgCount = 0

	return bstream.read(co.wrap(function*() {
		const messages = yield fetch(lastMessageId);
		msgCount += messages.length

		if(messages.length === 0) return null;

		for(const msg of messages) {
			yield this.push(msg);
		}

		lastMessageId = R.last(messages).id;
	}));
}

const fetchAllMessagesGeneric = co.wrap(function*(fetch) {
	return getStream.array(
		fetchAllMessagesGenericStream(fetch)
	);
});

const fetchAllMessagesStream = function(textChannel) {
	function fetch(lastMessageId) {
		return textChannel.fetchMessages({
			limit: 100,
			before: lastMessageId
		})
		.then(col => col.array());
	}

	return fetchAllMessagesGenericStream(fetch);
};

const fetchAllMessages = co.wrap(function*(textChannel) {
	const out = yield getStream.array(
		fetchAllMessagesStream(textChannel)
	);

	console.log(`#${textChannel.name} @ ${textChannel.guild.name}: total: ${out.length} messages`);

	return {
		channel: textChannel,
		messages: out
	};
});

module.exports = { fetchAllMessagesGenericStream, fetchAllMessagesGeneric, fetchAllMessagesStream, fetchAllMessages };
