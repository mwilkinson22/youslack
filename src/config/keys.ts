export interface IConfigObject {
	slackAuth: string;
	youtrackAuth: string;
	youslackUrl: string;
	appClient: string;
	appSecret: string;
	team_id: string;
	mongoURI: string | number;
}

let keys: IConfigObject;
if (process.env.NODE_ENV === "production") {
	keys = require("./prod").default;
} else {
	keys = require("./dev").default;
}

export { keys };
