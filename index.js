//Modules
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

//Boot up express
const app = express();
app.use(bodyParser.json());

//Get auth key
const { slackAuth, youtrackAuth } = require("./config/keys");

//Set post headers
const headers = {
	"Content-type": "application/json",
	Authorization: slackAuth
};

//Main Route
app.post("/", (req, res) => {
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
					} issues in one message?! Do you want Skynet?! Because this is how you get Skynet!`
				},
				{ headers }
			);
		} else {
			_.map(matches, async issue => {
				//Get Headers for YouTrack API
				const headers = {
					"Content-type": "application/json",
					Authorization: youtrackAuth
				};
				const response = await axios.get(
					`https://youtrack.ardensoftware.com/youtrack/api/${issue}`,
					{ headers }
				);

				console.log("--------------------------");
				console.log(response);

				const title = "Fix All Impact Bugs";
				const description =
					"Now this is a story all about how my life got flipped turned upside down and I'd like to take a minute, just sit right there, I'll tell you how I became the prince of a town called Bel-Air. In West Philadelphia born and raised, on the playground is where I spent most of my days. Chilling out, maxing, relaxing all cool and all shooting some b-ball outside of the school, when a couple of guys who were up to no good started making trouble in my neighborhood. I got in one little fight and my mom got scared And said \"You're moving with your auntie and uncle in Bel-Air\"";
				const text = `<https://youtrack.ardensoftware.com/youtrack/issue/${issue}|${issue.toUpperCase()} - ${title}>\n${description}`;
				await axios.post(
					"https://slack.com/api/chat.postMessage",
					{
						channel,
						thread_ts: ts,
						text
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
