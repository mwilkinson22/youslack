//Modules
import _ from "lodash";
import axios from "axios";
import { Request, Response } from "express";

//Decorators
import { post, controller } from "./decorators";

//Config
import { keys } from "../config/keys";
const { projects, youtrackAuth } = keys;

//Model
import { Token, IToken } from "../models/Token";

//Helpers
import { formatMessageFromYoutrackIssue } from "../helpers/messageHelper";

async function postMessageToSlack(token: IToken, channel: string, ts: string, text: string): Promise<any> {
	return axios.post(
		"https://slack.com/api/chat.postMessage",
		{
			channel,
			thread_ts: ts,
			text
		},
		{
			headers: {
				"Content-type": "application/json",
				Authorization: `Bearer ${token.access_token}`
			}
		}
	);
}

//Controller
@controller()
class MessageController {
	/**
	 * Called every time a message is submitted in Slack
	 */
	@post("/")
	async processMessage(req: Request, res: Response) {
		const { event, challenge } = req.body;

		//Check for project environment variable
		if (!projects || !projects.replace(/\|/gi, "").length) {
			console.error("A valid PROJECTS variable must be supplied.");
		} else {
			//Make sure we have no empty strings or every number will try to return something
			const prefixes = projects
				.split("|")
				.filter(str => str.length)
				.join("|");

			//Create a regex from the environment variable
			const regex = new RegExp(`(${prefixes})-\\d+`, "gi");

			//Ensure we have an event object to work with
			if (event) {
				type eventType = {
					//User's Message
					text: string;
					//Channel Id
					channel: string;
					//Timestamp, effectively used as a message id
					ts: string;
					//Subtype
					subtype: "bot_message" | string | null;
					//User Id
					user: string;
				};
				const { text, channel, ts, subtype, user }: eventType = event;

				//Get the user token
				const token = await Token.findOne({ user_id: user }).lean();

				//IMPORTANT - We only reply to human users to prevent infinite loops
				//We also make sure we've got a valid token and valid message.
				if (subtype !== "bot_message" && token && text) {
					//Get an array of all the matches in the user's message
					const matches = _.uniq(text.match(regex));

					//Maximum 10 responses to prevent spam
					if (matches.length > 10) {
						//Post an error message to slack
						const text = `${matches.length} issues in one message?! Do you want Skynet?! Because this is how you get Skynet!`;
						await postMessageToSlack(token, channel, ts, text);
					} else {
						//Pull the issue info from youtrack
						const issues = await Promise.all(
							matches.map(issue =>
								axios
									.get(
										`https://youtrack.ardensoftware.com/youtrack/api/issues/${issue}?fields=summary,description,idReadable`,
										{
											headers: {
												"Content-type": "application/json",
												Authorization: youtrackAuth
											}
										}
									)
									.catch(error => {
										console.error(
											`${error.response.status} error retrieving issue '${issue}' from YouTrack`,
											error.response.data
										);
									})
							)
						);

						//Loop through and submit replies
						await Promise.all(
							issues.map(issue => {
								if (issue && issue.data) {
									const { idReadable, summary, description } = issue.data;

									//Get Message Params
									const text = formatMessageFromYoutrackIssue(idReadable, summary, description);

									return postMessageToSlack(token, channel, ts, text);
								}
							})
						);
					}
				}
			}
		}

		//Return the challenge object to Slack, so it knows the operation completed successfully
		res.send({ challenge });
	}
}
