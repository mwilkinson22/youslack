//Modules
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

//Boot up express
const app = express();
app.use(bodyParser.json());

//Get auth keys
const { slackAuth, youtrackAuth, appClient, appSecret, team_id } = require("./config/keys");

//Set axios headers
const slackHeaders = {
	"Content-type": "application/json",
	Authorization: slackAuth
};
const youtrackHeaders = {
	"Content-type": "application/json",
	Authorization: youtrackAuth
};

//Auth Variables
const redirect_uri = "https://as-youslack.herokuapp.com/auth_redirect";

//Escape text
function escapeChars(text) {
	return text
		.replace(/\&/g, "&amp;")
		.replace(/\</g, "&lt;")
		.replace(/\>/g, "&gt;");
}

//Initial auth step
app.get("/auth", (req, res) => {
	const params = {
		client_id: appClient,
		team_id,
		redirect_uri,
		scope: "channels:history,chat:write:bot,groups:history,im:history,mpim:history"
	};
	const paramStr = _.map(params, (val, key) => `${key}=${val}`).join("&");
	res.redirect(`https://slack.com/oauth?${paramStr}`);
});

//Get Access Token
app.get("/auth_redirect", (req, res) => {
	console.log("ATTEMPTING AUTH");
	console.log(req);
	const { code } = req.query;
	axios.post("https://slack.com/api/oauth.access", {
		client_id: appClient,
		client_secret: appSecret,
		code,
		redirect_uri
	});
	res.send({});
});

//Handle Incoming Messages
app.post("/", (req, res) => {
	const { event, challenge } = req.body;

	if (event) {
		const { text, channel, ts, subtype } = event;

		//IMPORTANT - Need this if to prevent infinite loops
		if (subtype !== "bot_message") {
			const matches = _.uniq(
				text.match(
					/(WEB|IM|WSUP|WTST|EN|LENS|ICN|WIKI|nService|STAN|TOP|ILL|MTP|MISC)-\d+/gi
				)
			);

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
					{ headers: slackHeaders }
				);
			} else {
				_.map(matches, async issue => {
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
						const { summary, description } = response.data;
						const text = `<https://youtrack.ardensoftware.com/youtrack/issue/${issue}|${issue.toUpperCase()} - ${escapeChars(
							summary
						)}>\n${escapeChars(description)}`;
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
	}
	res.send({ challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
