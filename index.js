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
	console.log("NEW MESSAGE");
	console.log(event);
	console.log("---------------------");
	if (event.text.includes("MWTEST")) {
		axios.post(
			"https://hooks.slack.com/services/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",
			{
				channel: event.channel,
				thread_ts: event.ts,
				text: "Hello world, " + matches.join(", ")
			}
		);
	}
	console.log("---------------------------------------------------------");
	res.send({ challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
