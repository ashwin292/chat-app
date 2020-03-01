const generateMessage = (username, text, pos) => {
	return ({
		username,
		text,
		pos,
		createdAt: new Date().getTime()
	})
}

const generateLocationMessage = (username, url, pos) => {
	return ({
		username,
		text: url,
		pos,
		createdAt: new Date().getTime()
	})
}

module.exports = {
	generateMessage,
	generateLocationMessage
}