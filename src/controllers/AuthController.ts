//Modules
import _ from "lodash";
import qs from "qs";
import axios from "axios";
import { Request, Response } from "express";

//Decorators
import { get, controller } from "./decorators";

//Config
import { keys } from "../config/keys";
const { appClient, appSecret, youslackUrl, team_id } = keys;

//Constants
const redirect_uri = `${youslackUrl}/auth_redirect`;

//Model
import { Token } from "../models/Token";

@controller()
class AuthController {
	/**
	 * Redirects the user to the Slack oauth procedure
	 */
	@get("/auth")
	initialAuth(req: Request, res: Response) {
		const params = {
			client_id: appClient,
			team_id,
			redirect_uri,
			scope: "channels:history,chat:write:bot,groups:history,im:history,mpim:history"
		};
		const paramStr = _.map(params, (val: string, key: string) => `${key}=${val}`).join("&");
		res.redirect(`https://slack.com/oauth?${paramStr}`);
	}

	/**
	 * Once the user has authorised via slack, they're redirected here.
	 * We save the access token to the database
	 */
	@get("/auth_redirect")
	async authRedirect(req: Request, res: Response) {
		const { code } = req.query;
		const params = {
			client_id: appClient,
			client_secret: appSecret,
			code,
			redirect_uri
		};

		//Post the params to the slack oauth access url
		const token = await axios.post("https://slack.com/api/oauth.access", qs.stringify(params), {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});

		type tokenData = { ok: boolean; access_token: string; user_id: string };
		const { ok, access_token, user_id }: tokenData = token.data;
		if (ok) {
			//If we already have a token for this user, update it with the new one.
			//Otherwise, create a new token for them
			const existingToken = await Token.findOne({ user_id });
			if (existingToken) {
				existingToken.access_token = access_token;
				await existingToken.save();
			} else {
				const token = new Token({
					access_token,
					user_id
				});
				await token.save();
			}

			res.send("Authentication complete. Back to work.");
		} else {
			res.send("Authentication error");
		}
	}
}
