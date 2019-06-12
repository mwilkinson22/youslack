//Modules
const _ = require("lodash");
const axios = require("axios");
const { youtrackAuth } = require("../config/keys");
const mongoose = require("mongoose");
const Token = mongoose.model("tokens");

//Set axios headers
const youtrackHeaders = {
	"Content-type": "application/json",
	Authorization: youtrackAuth
};

//Escape text
function escapeChars(text) {
	return text
		.replace(/\&/g, "&amp;")
		.replace(/\</g, "&lt;")
		.replace(/\>/g, "&gt;");
}

module.exports = app => {
	app.post("/", async (req, res) => {
		const { event, challenge } = req.body;

		if (event) {
			const { text, channel, ts, subtype, user } = event;
			const token = await Token.findOne({ user_id: user });

			//IMPORTANT - Need this if to prevent infinite loops
			if (subtype !== "bot_message" && token && text) {
				const headers = {
					"Content-type": "application/json",
					Authorization: `Bearer ${token.access_token}`
				};

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
						{ headers }
					);
				} else {
					_.map(matches, async issue => {
						let errorFound = false;
						const response = await axios.get(
							`https://youtrack.ardensoftware.com/youtrack/api/issues/${issue}?fields=summary,description`,
							{
								headers: youtrackHeaders
							}
						);
						if (!errorFound) {
							const { summary, description } = response.data;

							//Get Message Params
							const text = `<https://youtrack.ardensoftware.com/youtrack/issue/${issue}|${issue.toUpperCase()} - ${escapeChars(
								summary
							)}>\n${escapeChars(description)}`;
							const url = "https://slack.com/api/chat.postMessage";
							const params = {
								channel,
								thread_ts: ts,
								text: text.length < 3000 ? text : `${text.substr(0, 2997)}...`
							};
							await axios.post(url, params, {
								headers
							});
						}
					});
				}
			}
		}
		res.send({ challenge });
	});
};
