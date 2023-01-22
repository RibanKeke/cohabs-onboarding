import {
  ExecutionSummary,
  RoomsStats,
  UserStats,
} from "./interfaces/commands.interface";
import Report from "../utils";
import { checkStripeUsers, processUsers } from "./actions/stripe.users";
import {
  checkStripeProducts,
  processRooms,
  reportInvalidRooms,
} from "./actions/stripe.products";

/**
 * Sync cohabUser to Stripe: Add missing stripe user, create link in the database then report the changes.
 */
async function syncUsers(commit: boolean): Promise<ExecutionSummary> {
  Report.logProgress("...Progress:", "Syncing cohab users to stripe", "info");
  const { usersCount, usersSummary } = await checkStripeUsers();

  const missingExecutionStats = await processUsers(
    "missing",
    usersSummary.missing,
    commit
  );
  const invalidExecutionStats = await processUsers(
    "invalid",
    usersSummary.invalid,
    commit
  );
  const brokenExecutionStats = await processUsers(
    "broken",
    usersSummary.broken,
    commit
  );
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

async function syncRooms(commit: boolean) {
  Report.logProgress("...Progress:", "Syncing cohab rooms to stripe", "info");
  const { roomsCount, roomsSummary } = await checkStripeProducts();

  const missingExecutionStats = await processRooms(
    "missing",
    roomsSummary.missing,
    commit
  );
  const invalidExecutionStats = reportInvalidRooms(roomsSummary.invalid);
  const brokenExecutionStats = await processRooms(
    "broken",
    roomsSummary.broken,
    commit
  );
  const roomsExecutionStats: RoomsStats = {
    synced: roomsSummary.synced.length,
    count: roomsCount,
    done: missingExecutionStats.done + brokenExecutionStats.done,
    failed: missingExecutionStats.failed + brokenExecutionStats.failed,
    skipped:
      missingExecutionStats.skipped +
      invalidExecutionStats.skipped +
      brokenExecutionStats.skipped,
  };

  Report.logProgress<RoomsStats>(
    "Completed",
    "Cohab rooms synchronization complete",
    "success",
    {
      data: [roomsExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced"],
    }
  );

  return { rooms: roomsExecutionStats };
}

async function syncStripeSubscriptions() {
  console.log("Hello");
}

export { syncUsers, syncRooms, syncStripeSubscriptions };
