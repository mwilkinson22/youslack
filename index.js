const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");
const axios = require("axios");
app.use(bodyParser.json());
const headers = {
	"Content-Type": "application/json",
	Authorization:
		"Bearer xoxp-562776330048-564957021846-563851623157-81801d4b63f78be5092d7e29ebbaaff1"
};

app.post("/", (req, res) => {
	const { text, channel, ts, subtype } = req.body.event;
	if (subtype !== "bot_message") {
		const matches = _.uniq(text.match(/(WEB|IM|WSUP)-\d+/gi));
		if (matches.length > 10) {
			const newMessage = {
				channel: channel,
				thread_ts: ts,
				text: "Nah mate"
			};
			axios.post("https://slack.com/api/chat.postMessage", newMessage, { headers });
		} else {
			_.map(matches, async issue => {
				console.log(issue);
				const newMessage = {
					channel: channel,
					thread_ts: ts,
					text: `${issue} link goes here`
				};
				await axios.post("https://slack.com/api/chat.postMessage", newMessage, { headers });
			});
		}
	}
	res.send({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
