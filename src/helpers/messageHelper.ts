//Config
import { keys } from "../config/keys";
const { youtrackUrl } = keys;

export function escapeChars(text: string): string {
	if (text) {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	} else {
		return "";
	}
}

export function formatMessageFromYoutrackIssue(issue: string, summary: string, description: string): string {
	return `<${youtrackUrl}issue/${issue}|${issue} - ${escapeChars(summary)}>\n${escapeChars(description)}`;
}
