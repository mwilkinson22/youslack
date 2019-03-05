//Modules
const _ = require("lodash");
const express = require("express");
const bodyParser = require("body-parser");

//Set up express
const app = express();
app.use(bodyParser.json());

//Add Routes
require("./auth")(app);
require("./messages")(app);

//Prevent annoying GET error
app.get("/", (req, res) => {
	res.send("Hello, world");
});

//Start App
const PORT = process.env.PORT || 3000;
app.listen(PORT);
