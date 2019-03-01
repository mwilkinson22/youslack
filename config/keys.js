process.env.NODE_ENV === "production"
	? (module.exports = require("./heroku"))
	: (module.exports = require("./local"));
