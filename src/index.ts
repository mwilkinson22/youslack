//Modules
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";

//Set up express app
const app = express();
app.use(bodyParser.json());

//Set up mongoose
const { keys } = require("./config/keys");
mongoose
	.connect(keys.mongoURI, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useUnifiedTopology: true
	})
	.then(() => console.info("Mongoose Initialised"));

//Get Token Model
import "./models/Token";

//Set up routing
import { AppRouter } from "./AppRouter";
import "./controllers/AuthController";
import "./controllers/MessageController";
app.use(AppRouter.getInstance());

//Prevent annoying GET error in browser
app.get("/", (req: Request, res: Response) => {
	res.send("Hello, world");
});

//Start App
const PORT = process.env.PORT || 3000;
app.listen(PORT);
console.info(`App is running on Port ${PORT}`);
