//Modules
import _ from "lodash";
import axios, { AxiosPromise } from "axios";
import { Request, Response } from "express";

//Decorators
import { post, controller } from "./decorators";

//Config
import { keys } from "../config/keys";
const { youtrackUrl, youtrackAuth } = keys;

//Model
import { Token, IToken } from "../models/Token";

//Helpers
import { formatMessageFromYoutrackIssue } from "../helpers/messageHelper";

//External API handlers
async function youtrackQuery(apiPath: string) {
	return axios.get(`${youtrackUrl}api/${apiPath}`, {
		headers: {
			"Content-type": "application/json",
			Authorization: youtrackAuth
		}
	});
}

async function postMessageToSlack(
	token: IToken,
	channel: string,
	ts: string,
	text: string,
	as_user: boolean
): Promise<AxiosPromise> {
	return axios.post(
		"https://slack.com/api/chat.postMessage",
		{
			channel,
			thread_ts: ts,
			text,
			as_user
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

		//Get projects
		const projects = await youtrackQuery("admin/projects?fields=shortName");

		//Check for project environment variable
		if (!projects.data || !projects.data.length) {
			console.error("No Projects");
		} else {
			const prefixes = projects.data.map((project: { shortName: string }) => project.shortName).join("|");

			//Create a regex from the retrieved projects
			const regex = new RegExp(`(${prefixes})-\\d+`, "gi");

			//Ensure we have an event object to work with
			if (event) {
				type eventType = {
					//User's Message
					text: string;
					//Channel Id
					channel: string;
					//Timestamp of the message, effectively used as a message id
					ts: string;
					//If a message is in the thread, this shows the timestamp of the "parent" message
					//Once again this is effectively an ID, but more importantly allows us to detect
					//if we're looking at a reply in a thread and prevent infinite loops
					thread_ts: string;
					//Subtype
					subtype: "bot_message" | string | null;
					//User Id
					user: string;
				};
				const { text, channel, ts, user, subtype, thread_ts }: eventType = event;

				//Get the user token
				const token = await Token.findOne({ user_id: user }).lean();

				//IMPORTANT - We only reply to normal messages, not thread replies,
				//this will prevent infinite loops
				//We also don't reply to bots
				//We also make sure we've got a valid token and valid message.
				if (!thread_ts && subtype !== "bot_message" && token && text) {
					//Get an array of all the matches in the user's message
					const matches = _.uniq(text.match(regex));

					//Maximum 10 responses to prevent spam
					if (matches.length > 10) {
						//Post an error message to slack
						const text = `${matches.length} issues in one message?! Do you want Skynet?! Because this is how you get Skynet!`;
						await postMessageToSlack(token, channel, ts, text, false);
					} else {
						//Pull the issue info from youtrack
						const issues = await Promise.all(
							matches.map(issue =>
								youtrackQuery(`issues/${issue}?fields=summary,description,idReadable`).catch(error => {
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

									return postMessageToSlack(token, channel, ts, text, true);
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
