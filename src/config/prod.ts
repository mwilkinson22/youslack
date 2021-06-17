import { IConfigObject } from "./keys";

declare global {
	namespace NodeJS {
		interface ProcessEnv {
			SLACK_AUTH: string;
			YOUTRACK_AUTH: string;
			APP_CLIENT: string;
			APP_SECRET: string;
			TEAM_ID: string;
			MONGO_URI: string;
			YOUSLACK_URL: string;
			YOUTRACK_URL: string;
			MAX_MESSAGES: string;
			PORT?: string;
		}
	}
}

const keys: IConfigObject = {
	slackAuth: process.env.SLACK_AUTH,
	youtrackAuth: process.env.YOUTRACK_AUTH,
	appClient: process.env.APP_CLIENT,
	appSecret: process.env.APP_SECRET,
	team_id: process.env.TEAM_ID,
	maxMessages: parseInt(process.env.MAX_MESSAGES) || 20,
	mongoURI: process.env.MONGO_URI,
	youtrackUrl: process.env.YOUTRACK_URL,
	youslackUrl: process.env.YOUSLACK_URL
};
export default keys;
