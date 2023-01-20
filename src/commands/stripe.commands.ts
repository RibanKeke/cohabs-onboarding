import { ExecutionSummary, UserStats } from "./interfaces/commands.interface";
import Report from "../utils";
import { checkStripeUsers, processUsers } from "./actions/stripe.users";

/**
 * Sync cohabUser to Stripe: Add missing stripe user, create link in the database then report the changes.
 */
async function syncUsers(): Promise<ExecutionSummary> {
  Report.logProgress("...Progress:", "Syncing cohab users to stripe", "info");
  const { usersCount, usersSummary } = await checkStripeUsers();

  const missingExecutionStats = await processUsers(
    "missing",
    usersSummary.missing,
    false
  );
  const invalidExecutionStats = await processUsers(
    "invalid",
    usersSummary.invalid,
    false
  );
  const brokenExecutionStats = await processUsers(
    "broken",
    usersSummary.broken,
    false
  );

  if (usersSummary.missing) {
    await processUsers("missing", usersSummary.missing, false);
  }

  if (usersSummary.invalid) {
    await processUsers("invalid", usersSummary.invalid, false);
  }

  if (usersSummary.broken) {
    await processUsers("broken", usersSummary.broken, false);
  }
  const usersExecutionStats: UserStats = {
    count: usersCount,
    done:
      missingExecutionStats.done +
      invalidExecutionStats.done +
      brokenExecutionStats.done,
    failed:
      missingExecutionStats.failed +
      invalidExecutionStats.failed +
      brokenExecutionStats.failed,
    skipped:
      missingExecutionStats.skipped +
      invalidExecutionStats.skipped +
      brokenExecutionStats.skipped,
  };

  Report.logProgress<UserStats>(
    "Completed",
    "Cohab users synchronization complete",
    "success",
    {
      data: [usersExecutionStats],
      reportFields: ["count", "done", "failed", "skipped"],
    }
  );

  return { users: usersExecutionStats };
}

async function syncStripeProducts() {
  console.log("Hello");
}

async function syncStripeSubscriptions() {
  console.log("Hello");
}

export { syncUsers, syncStripeProducts, syncStripeSubscriptions };
