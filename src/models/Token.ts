import mongoose, { Schema, Document } from "mongoose";

export interface IToken {
	user_id: string;
	access_token: string;
}

interface ITokenMongoose extends IToken, Document {}

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

export const Token = mongoose.model<ITokenMongoose>("tokens", schema);
