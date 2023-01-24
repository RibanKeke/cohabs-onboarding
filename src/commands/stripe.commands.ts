import {
  ExecutionSummary,
  LeasesStats,
  RoomsStats,
  UserStats,
} from "./interfaces/commands.interface";
import { checkStripeUsers, processUsers } from "./actions/stripe.users";
import {
  checkStripeProducts,
  processRooms,
  reportInvalidRooms,
} from "./actions/stripe.products";
import {
  checkStripeSubscriptions,
  processLeases,
  reportInvalidLeases,
} from "./actions/stripe.subscriptions";
import report from "../utils";

/**
 * Checks and synchronises cohabs users to stripe customers
 * @param commit Enable automatic fix of detected issues
 * @returns ExecutionSummary
 */
async function syncUsers(commit: boolean): Promise<ExecutionSummary> {
  report.logProgress("...Progress:", "Syncing cohab users to stripe", "info");
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

  report.logProgress<UserStats>(
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

/**
 * Checks and synchronises cohabs rooms to stripe products
 * @param commit Enable automatic fix of detected issues
 * @returns ExecutionSummary
 */
async function syncRooms(commit: boolean) {
  report.logProgress("...Progress:", "Syncing cohab rooms to stripe", "info");
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

  report.logProgress<RoomsStats>(
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

/**
 * Checks and synchronises cohabs leases to stripe subscriptions
 * @param commit Enable automatic fix of detected issues
 * @returns ExecutionSummary
 */
async function syncLeases(commit: boolean) {
  report.logProgress(
    "...Progress:",
    "Syncing cohab leases to stripe subscriptions",
    "info"
  );
  const { leasesCount, leasesSummary } = await checkStripeSubscriptions();

  const missingExecutionStats = await processLeases(
    "missing",
    leasesSummary.missing,
    commit
  );
  const invalidExecutionStats = reportInvalidLeases(leasesSummary.invalid);

  const brokenExecutionStats = await processLeases(
    "broken",
    leasesSummary.broken,
    commit
  );
  const leasesExecutionStats: LeasesStats = {
    synced: leasesSummary.synced.length,
    count: leasesCount,
    done: missingExecutionStats.done + brokenExecutionStats.done,
    failed: missingExecutionStats.failed + brokenExecutionStats.failed,
    skipped:
      missingExecutionStats.skipped +
      invalidExecutionStats.skipped +
      brokenExecutionStats.skipped,
  };

  report.logProgress<RoomsStats>(
    "Completed",
    "Cohab leases synchronization complete",
    "success",
    {
      data: [leasesExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced"],
    }
  );

  return { rooms: leasesExecutionStats };
}

async function runAll(commit: boolean) {
  await syncUsers(commit);
  await syncRooms(commit);
  await syncLeases(commit);
}

export { syncUsers, syncRooms, syncLeases, runAll };
