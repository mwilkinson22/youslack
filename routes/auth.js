//Modules
const _ = require("lodash");
const qs = require("query-string");
const axios = require("axios");
const mongoose = require("mongoose");
const Token = mongoose.model("tokens");

//Variables
const { appClient, appSecret, team_id } = require("../config/keys");
const redirect_uri = "https://as-youslack.herokuapp.com/auth_redirect";

module.exports = app => {
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
	app.get("/auth_redirect", async (req, res) => {
		const { code } = req.query;
		const params = {
			client_id: appClient,
			client_secret: appSecret,
			code,
			redirect_uri
		};
		const token = await axios.post("https://slack.com/api/oauth.access", qs.stringify(params), {
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			}
		});

		const { ok, access_token, user_id } = token.data;
		if (ok) {
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
	});
};
