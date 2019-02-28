const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");
const axios = require("axios");
app.use(bodyParser.json());

app.post("/", (req, res) => {
	const { challenge, event } = req.body;
	const matches = _.uniq(event.text.match(/(WEB|IM|WSUP)-\d+/gi));
	console.log("---------------------------------------------------------");
	if (event.text.includes("MWTEST")) {
		const newMessage = {
			channel: event.channel,
			thread_ts: event.ts,
			text: "Hello world, " + matches.join(", ")
		};
		const headers = {
			"Content-Type": "application/json",
			Authorization:
				"Bearer xoxp-562776330048-564957021846-563851623157-81801d4b63f78be5092d7e29ebbaaff1"
		};
		axios
			.post("https://slack.com/api/chat.postMessage", newMessage, { headers })
			.then(response => {
				console.log(response);
			});
	}
	console.log("---------------------------------------------------------");
	res.send({ challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
