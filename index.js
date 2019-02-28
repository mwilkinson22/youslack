//Modules
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

//Boot up express
const app = express();
app.use(bodyParser.json());

//Get auth key
const { Authorization } = require("./config/keys");

//Set post headers
const headers = {
	"Content-type": "application/json",
	Authorization
};

//Main Route
app.post("/", (req, res) => {
	console.log(Authorization);
	const { text, channel, ts, subtype } = req.body.event;

	//Need this to prevent infinite loops
	if (subtype !== "bot_message") {
		const matches = _.uniq(text.match(/(WEB|IM|WSUP)-\d+/gi));

		//Maximum 10 responses to prevent spam
		if (matches.length > 10) {
			axios.post(
				"https://slack.com/api/chat.postMessage",
				{
					channel,
					thread_ts: ts,
					text: `${
						matches.length
					} issues?! Do you want Skynet? Because this is how you get Skynet`
				},
				{ headers }
			);
		} else {
			_.map(matches, async issue => {
				await axios.post(
					"https://slack.com/api/chat.postMessage",
					{
						channel,
						thread_ts: ts,
						text: `${issue} link goes here`
					},
					{ headers }
				);
			});
		}
	}
	res.send({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
