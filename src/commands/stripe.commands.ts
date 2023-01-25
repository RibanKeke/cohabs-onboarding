import report from "../utils";
import { checkStripeUsers, processUsers } from "./actions/stripe.users";
import {
  CheckResult,
  ExecutionStats,
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
import { LeasesView, Rooms, Users } from "../database";

function reportCheckErrors<T>(
  source: string,
  errorItems: Array<CheckResult<T>>,
  reportFields: Array<keyof T>
): ExecutionStats {
  const leasesList: Array<T & { message?: string }> = errorItems.map(
    (executionRecord) => ({
      ...executionRecord.item,
      message: executionRecord.message,
    })
  );
  report.logProgress<T & { message?: string }>(
    `Errors:${source}`,
    "Some records have failed during the check process",
    "failure",
    {
      data: leasesList,
      reportFields: [...reportFields, "message"],
    }
  );
  return { done: 0, failed: 0, skipped: leasesList.length };
}

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
    usersSummary.missing.map((missing) => missing.item),
    commit
  );
  const brokenExecutionStats = await processUsers(
    "broken",
    usersSummary.broken.map((broken) => broken.item),
    commit
  );

  if (usersSummary.error.length > 0) {
    reportCheckErrors<Users>("USERS", usersSummary.error, [
      "active",
      "id",
      "firstName",
      "lastName",
      "stripeCustomerId",
    ]);
  }

  const usersExecutionStats: UserStats = {
    count: usersCount,
    done: missingExecutionStats.done + brokenExecutionStats.done,
    failed: missingExecutionStats.failed + brokenExecutionStats.failed,
    skipped: missingExecutionStats.skipped + brokenExecutionStats.skipped,
    synced: (usersSummary?.synced ?? []).length,
    error: usersSummary.error.length,
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
  const invalidExecutionStats = reportInvalidRooms(roomsSummary.invalid);

  const missingExecutionStats = await processRooms(
    "missing",
    roomsSummary.missing.map((missing) => missing.item),
    commit
  );
  const brokenExecutionStats = await processRooms(
    "broken",
    roomsSummary.broken.map((broken) => broken.item),
    commit
  );

  if (roomsSummary.error.length > 0) {
    reportCheckErrors<Rooms>("USERS", roomsSummary.error, [
      "active",
      "id",
      "houseId",
      "stripeProductId",
    ]);
  }

  const roomsExecutionStats: RoomsStats = {
    synced: (roomsSummary?.synced ?? []).length,
    count: roomsCount,
    done: missingExecutionStats.done + brokenExecutionStats.done,
    failed: missingExecutionStats.failed + brokenExecutionStats.failed,
    skipped:
      missingExecutionStats.skipped +
      invalidExecutionStats.skipped +
      brokenExecutionStats.skipped,
    error: roomsSummary.error.length,
  };

  report.logProgress<RoomsStats>(
    `${step ? "Sync step: USERS" : "Sync USERS"}`,
    "Stripe synchronization complete",
    "success",
    {
      data: step ? [] : [roomsExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced", "error"],
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

  if (leasesSummary.error.length > 0) {
    reportCheckErrors<LeasesView>("USERS", leasesSummary.error, [
      "id",
      "name",
      "firstName",
      "lastName",
      "roomId",
      "houseId",
      "stripeCustomerId",
      "stripeProductId",
      "stripeSubscriptionId",
    ]);
  }

  const leasesExecutionStats: LeasesStats = {
    synced: (leasesSummary?.synced ?? []).length,
    count: leasesCount,
    done: missingExecutionStats.done + brokenExecutionStats.done,
    failed: missingExecutionStats.failed + brokenExecutionStats.failed,
    skipped:
      missingExecutionStats.skipped +
      invalidExecutionStats.skipped +
      brokenExecutionStats.skipped,
    error: leasesSummary.error.length,
  };

  report.logProgress<RoomsStats>(
    `${step ? "Sync step: LEASES" : "Sync LEASES"}`,
    "Stripe synchronization complete",
    "success",
    {
      data: step ? [] : [leasesExecutionStats],
      reportFields: ["count", "done", "failed", "skipped", "synced", "error"],
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
