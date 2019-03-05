const mongoose = require("mongoose");
const { Schema } = mongoose;

const schema = new Schema({
	user_id: {
		type: String,
		required: true
	},
	access_token: {
		type: String,
		required: true
	}
});

mongoose.model("tokens", schema);
