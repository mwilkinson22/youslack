const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());

app.post("/", (req, res) => {
	console.log(req.body);
	res.send({});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);
