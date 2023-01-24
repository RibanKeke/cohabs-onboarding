import report from "../utils";
import { checkStripeUsers, processUsers } from "./actions/stripe.users";
import {
  ExecutionSummary,
  LeasesStats,
  RoomsStats,
  UserStats,
} from "./commands.interface";
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

/**
 * Checks and synchronize cohabs users to stripe customers
 * @param commit Enable automatic fix of detected issues
 * @returns ExecutionSummary
 */
async function syncUsers(
  commit: boolean,
  step = false
): Promise<Pick<Required<ExecutionSummary>, "users">> {
  report.logProgress(
    `${step ? "Sync step: USERS" : "Sync USERS"}`,
    "Stripe synchronization started",
    "info"
  );

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
    synced: usersSummary.synced.length,
  };
  report.logProgress<UserStats>(
    `${step ? "Sync step: USERS" : "Sync USERS"}`,
    "Stripe synchronization complete",
    "success",
    {
      data: step ? [] : [usersExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced"],
    }
  );

  return { users: usersExecutionStats };
}

/**
 * Checks and synchronises cohabs rooms to stripe products
 * @param commit Enable automatic fix of detected issues
 * @returns ExecutionSummary
 */
async function syncRooms(
  commit: boolean,
  step = false
): Promise<Pick<Required<ExecutionSummary>, "rooms">> {
  report.logProgress(
    `${step ? "Sync step: ROOMS" : "Sync ROOMS"}`,
    "Stripe synchronization started",
    "info"
  );
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
    `${step ? "Sync step: USERS" : "Sync USERS"}`,
    "Stripe synchronization complete",
    "success",
    {
      data: step ? [] : [roomsExecutionStats],
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
async function syncLeases(
  commit: boolean,
  step = false
): Promise<Pick<Required<ExecutionSummary>, "leases">> {
  report.logProgress(
    `${step ? "Sync step: LEASES" : "Sync LEASES"}`,
    "Stripe synchronization started",
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
    `${step ? "Sync step: LEASES" : "Sync LEASES"}`,
    "Stripe synchronization complete",
    "success",
    {
      data: step ? [] : [leasesExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced"],
    }
  );

  return { leases: leasesExecutionStats };
}

/**
 * Run synchronization tasks in sequence users -> rooms -> leases
 * @param commit Enable automatic fix of detected issues
 */
async function syncAll(commit: boolean) {
  report.logProgress("ALL SYNC", "Full Stripe synchronization started", "info");
  const { users } = await syncUsers(commit, true);
  const { rooms } = await syncRooms(commit, true);
  const { leases } = await syncLeases(commit, true);
  const AllSummary = {
    users: JSON.stringify(users),
    rooms: JSON.stringify(rooms),
    leases: JSON.stringify(leases),
  };
  report.logProgress<typeof AllSummary>(
    "ALL SYNC",
    "All synchronization tasks completed, \n REPORT:",
    "success",
    {
      data: [AllSummary],
      reportFields: ["leases", "rooms", "users"],
    }
  );
}

export { syncUsers, syncRooms, syncLeases, syncAll };
