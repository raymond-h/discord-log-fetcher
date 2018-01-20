const co = require('co');
const R = require('ramda');

function delay(ms, value) {
	return new Promise(resolve => setTimeout(resolve, ms, value));
}

const fetchAllMessagesGeneric = co.wrap(function*(fetch) {
	let lastMessageId = null;
	const out = [];

	while(true) {
		const messages = yield fetch(lastMessageId);

		if(messages.length === 0) break;

		out.push(...messages);

		lastMessageId = R.last(messages).id;

		yield delay(200 + Math.random() * 200);
	}

	return out;
});

const fetchAllMessages = co.wrap(function*(textChannel) {
	if(textChannel.lastMessageID == null) {
		return { channel: textChannel, messages: [] };
	}

	function fetch(lastMessageId) {
		return textChannel.fetchMessages({
			limit: 100,
			before: lastMessageId
		})
		.then(col => col.array());
	}

	const out = yield fetchAllMessagesGeneric(fetch);

	console.log(`#${textChannel.name} @ ${textChannel.guild.name}: total: ${out.length} messages`);

	return {
		channel: textChannel,
		messages: out
	};
});

module.exports = { fetchAllMessagesGeneric, fetchAllMessages };
