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

async function fetchAllMessagesGeneric(fetch) {
	return getStream.array(
		fetchAllMessagesGenericStream(fetch)
	);
};

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

async function fetchAllMessages(textChannel) {
	const out = await getStream.array(
		fetchAllMessagesStream(textChannel)
	);

	console.log(`#${textChannel.name} @ ${textChannel.guild.name}: total: ${out.length} messages`);

	return {
		channel: textChannel,
		messages: out
	};
};

module.exports = { fetchAllMessagesGenericStream, fetchAllMessagesGeneric, fetchAllMessagesStream, fetchAllMessages };
