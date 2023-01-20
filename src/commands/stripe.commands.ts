import { Entities } from "../database";
import { ExecutionSummary } from "../interfaces/commands.interface";
import Report from "../utils";
import { checkStripeUsers } from "./actions/stripe.actions";

/**
 * Sync cohabUser to Stripe: Add missing stripe user, create link in the database then report the changes.
 */
async function syncUsers(): Promise<ExecutionSummary> {
	Report.logProgress("...Progress:", "Syncing cohabusers to stripe", "info");
	const usersSummary = await checkStripeUsers();

	const missingUsers = Object.values(usersSummary.missing).map(executionRecord => executionRecord.user);
	Report.logProgress<Entities.Users>("...Progress:", "Missing stripe users", "warning", { data: missingUsers, reportFields: ["active", "id", "firstName", "lastName", "stripeCustomerId"] });

	const invalidStipeUsers = Object.values(usersSummary.invalid).map(executionRecord => executionRecord.user);
	Report.logProgress<Entities.Users>("...Progress:", "Invalid stripe users", "warning", { data: invalidStipeUsers, reportFields: ["active", "id", "firstName", "lastName", "stripeCustomerId"] });

	return {
		users: usersSummary
	};
}

async function syncStripeProducts() {
	console.log("Hello");
}

async function syncStripeSubscriptions() {
	console.log("Hello");
}

export { syncUsers, syncStripeProducts, syncStripeSubscriptions };
