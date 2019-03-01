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
const slackHeaders = {
	"Content-type": "application/json",
	Authorization: slackAuth
};

//Routes
app.get("/", (req, res) => {
	res.send("Hello, Arden user. How's it going?");
});
app.post("/", (req, res) => {
	const { text, channel, ts, subtype, challenge } = req.body.event;

	//Need this to prevent infinite loops
	if (subtype !== "bot_message" && text.includes("YOUSLACKTEST")) {
		const matches = _.uniq(text.match(/(WEB|IM|WSUP)-\d+/gi));

		//Maximum 20 responses to prevent spam
		if (matches.length > 20) {
			axios.post(
				"https://slack.com/api/chat.postMessage",
				{
					channel,
					thread_ts: ts,
					text: `${
						matches.length
					} issues in one message?! Do you want Skynet?! Because this is how you get Skynet!`
				},
				{ headers: slackHeaders }
			);
		} else {
			_.map(matches, async issue => {
				//Get Headers for YouTrack API
				const youtrackHeaders = {
					"Content-type": "application/json",
					Authorization: youtrackAuth
				};
				let errorFound = false;
				const response = await axios
					.get(
						`https://youtrack.ardensoftware.com/youtrack/api/issues/${issue}?fields=summary,description`,
						{
							headers: youtrackHeaders
						}
					)
					.catch(() => {
						errorFound = true;
					});
				if (!errorFound) {
					console.log("--------------------------");
					console.log(response);

					const { summary, description } = response.data;
					const text = `<https://youtrack.ardensoftware.com/youtrack/issue/${issue}|${issue.toUpperCase()} - ${summary}>\n${description}`;
					await axios.post(
						"https://slack.com/api/chat.postMessage",
						{
							channel,
							thread_ts: ts,
							text: text.length < 3000 ? text : `${text.substr(0, 2997)}...`
						},
						{ headers: slackHeaders }
					);
				}
			});
		}
	}
	res.send({ challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
