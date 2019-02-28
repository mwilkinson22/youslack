const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const _ = require("lodash");
app.use(bodyParser.json());

app.post("/", (req, res) => {
	const { challenge, event } = req.body;
	const matches = _.uniq(event.text.match(/(WEB|IM|WSUP)-\d+/gi));
	console.log("---------------------------------------------------------");
	console.log(req.body);
	console.log(matches);
	console.log("---------------------------------------------------------");
	res.send({ challenge });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
