import {
  findLeaseByStripeSubscriptionId,
  listCohabLeases,
  updateLease,
} from "../../database";
import { LeasesView } from "../../database/models";
import {
  createStripeSubscription,
  listStripeSubscription,
  NewStripeSubscription,
} from "../../stripe";
import report from "../../utils";
import {
  ExecutionRecord,
  ExecutionStats,
  LeasesSummary,
  RecordStatus,
  RecordSummary,
  UpdateResult,
} from "../commands.interface";

function checkLease(
  cohabLease: LeasesView,
  stripeSubscriptionIds: Array<string>
): { missing: boolean; broken: boolean; synced: boolean } {
  const missing = cohabLease.stripeSubscriptionId === null;
  const broken =
    cohabLease.stripeSubscriptionId !== null &&
    !stripeSubscriptionIds.includes(cohabLease.stripeSubscriptionId);
  const synced =
    cohabLease.houseId !== null &&
    cohabLease.stripeProductId !== null &&
    cohabLease.stripeCustomerId !== null &&
    cohabLease.userId !== null &&
    stripeSubscriptionIds.includes(cohabLease?.stripeSubscriptionId ?? "");
  return {
    missing,
    broken,
    synced,
  };
}

function checkVerifiedLeases(
  verifiedLeases: Array<LeasesView>,
  subscriptionIds: Array<string>
): LeasesSummary {
  const leasesSummary = verifiedLeases.reduce(
    (result, cohabLease) => {
      const { missing, broken, synced } = checkLease(
        cohabLease,
        subscriptionIds
      );

      if (missing) {
        const roomExecutionRecord: ExecutionRecord<LeasesView> = {
          message: "",
          status: "new",
          item: cohabLease,
        };
        return {
          ...result,
          missing: [...result.missing, roomExecutionRecord],
        };
      }

      if (synced) {
        const roomExecutionRecord: ExecutionRecord<LeasesView> = {
          message: "",
          status: "done",
          item: cohabLease,
        };
        return {
          ...result,
          synced: [...result.synced, roomExecutionRecord],
        };
      }

      if (broken) {
        const roomExecutionRecord: ExecutionRecord<LeasesView> = {
          message: "Leases' subscription id is missing in stripe",
          status: "new",
          item: cohabLease,
        };
        const invalidResult: RecordSummary<LeasesView> = [
          ...result.broken,
          roomExecutionRecord,
        ];
        return {
          ...result,
          broken: invalidResult,
        };
      }
      return result;
    },
    { missing: [], invalid: [], broken: [], synced: [] } as LeasesSummary
  );
  return leasesSummary;
}

function filterInvalidLeases(leases: Array<LeasesView>) {
  return leases
    .filter(
      (lease) =>
        lease.houseId === null ||
        lease.stripeCustomerId === null ||
        lease.stripeProductId === null ||
        lease.userId === null
    )
    .map((lease) => {
      const missingHouseIdMessage = lease.houseId
        ? ""
        : "Invalid link to houseId.";
      const missingCustomerIdMessage = lease.stripeCustomerId
        ? ""
        : "Invalid link to stripeCustomerId.";
      const missingUserIdMessage = lease.userId
        ? ""
        : "Invalid link to userId.";
      const missingProductIdMessage = lease.stripeProductId
        ? ""
        : "Invalid link to stripeProductId.";
      const executionRecord: ExecutionRecord<LeasesView> = {
        item: lease,
        message:
          missingUserIdMessage +
          " " +
          missingHouseIdMessage +
          " " +
          missingProductIdMessage +
          " " +
          missingCustomerIdMessage,
        status: "new",
      };
      return executionRecord;
    });
}

/**
 * Check if cohab lease has linked stripe subscription
 * @param cohabsLeases Existing cohabs leases
 * @param stripeSubscriptions Existing stripe subscriptions
 * @returns
 */
async function checkStripeSubscriptions(): Promise<{
  leasesSummary: LeasesSummary;
  leasesCount: number;
}> {
  const stripeSubscriptions = await listStripeSubscription();
  const cohabLeases = await listCohabLeases();
  const invalidLeases = filterInvalidLeases(cohabLeases);
  const verifiedLeases = cohabLeases.filter(
    (lease) =>
      !invalidLeases
        .map((invalidLease) => invalidLease.item.id)
        .includes(lease.id)
  );
  const subscriptionsIds = stripeSubscriptions.map(
    (subscription) => subscription.id
  );
  const leasesCount = cohabLeases.length;
  const leasesSummary = checkVerifiedLeases(verifiedLeases, subscriptionsIds);
  return {
    leasesCount,
    leasesSummary: { ...leasesSummary, invalid: invalidLeases },
  };
}

/**
 * Create new stripe subscription and update cohab lease with new stripeSubscriptionId
 * @param cohabLease Cohab lease
 * @param commit Flag for commit
 * @returns UpdateResult<LeasesView>
 */
async function syncStripeSubscription(
  cohabLease: LeasesView,
  commit: boolean
): Promise<UpdateResult<LeasesView>> {
  const stripeSubscription: NewStripeSubscription = {
    customer: cohabLease?.stripeCustomerId ?? "",
    items: [
      {
        price_data: {
          currency: "eur",
          product: cohabLease?.stripeProductId ?? "",
          recurring: {
            interval: "month",
          },
          unit_amount: Number(
            String(cohabLease.rentAmount).split(".").join("")
          ),
        },
      },
    ],
    metadata: {
      cohabLeaseId: cohabLease.id,
    },
  };
  const execute = async () => {
    const newStripeSubscription = await createStripeSubscription(
      stripeSubscription
    );
    await updateLease(cohabLease.id, {
      stripeSubscriptionId: newStripeSubscription.id,
    });
    const updatedSubscription = await findLeaseByStripeSubscriptionId(
      newStripeSubscription.id
    );
    if (updatedSubscription) {
      return updatedSubscription;
    } else {
      throw new Error(
        `Lease to update with id: ${cohabLease.id} was not found`
      );
    }
  };
  if (commit) {
    return await execute()
      .then((updatedLease) => {
        const successResult: UpdateResult<LeasesView> = {
          id: updatedLease.id,
          status: "done",
          target: {
            ...cohabLease,
            stripeSubscriptionId: updatedLease.stripeSubscriptionId,
          },
        };
        return successResult;
      })
      .catch((err) => {
        const failedResult: UpdateResult<LeasesView> = {
          id: cohabLease?.id,
          status: "failed",
          target: cohabLease,
          message: err.message,
        };
        return failedResult;
      });
  } else {
    const simResult: UpdateResult<LeasesView> = {
      id: cohabLease?.id,
      status: "skipped",
      target: cohabLease,
    };
    return simResult;
  }
}

function reportInvalidLeases(
  invalidLeases: RecordSummary<LeasesView>
): ExecutionStats {
  const leasesList: Array<LeasesView & { message: string }> = invalidLeases.map(
    (executionRecord) => ({
      ...executionRecord.item,
      message: executionRecord.message,
    })
  );
  report.logProgress<LeasesView & { message: string }>(
    "...Reporting:",
    "Invalid cohab leases - These records are skipped \n Please fix the issue and run the script again.",
    "warning",
    {
      data: leasesList,
      reportFields: [
        "id",
        "name",
        "firstName",
        "lastName",
        "roomId",
        "houseId",
        "stripeCustomerId",
        "stripeProductId",
        "stripeSubscriptionId",
        "message",
      ],
    }
  );
  return { done: 0, failed: 0, skipped: leasesList.length };
}

async function processLeases(
  origin: RecordStatus,
  leasesSummary: RecordSummary<LeasesView>,
  commit: boolean
): Promise<ExecutionStats> {
  const leasesList = leasesSummary.map(
    (executionRecord) => executionRecord.item
  );
  if (leasesList.length === 0) {
    return {
      done: 0,
      failed: 0,
      skipped: 0,
    };
  }
  report.logProgress<LeasesView>(
    "...Processing:",
    `${origin} stripe subscriptions`,
    "info",
    {
      data: leasesList,
      reportFields: [
        "status",
        "id",
        "roomId",
        "houseId",
        "houseName",
        "firstName",
        "lastName",
        "stripeCustomerId",
        "stripeProductId",
        "stripeSubscriptionId",
      ],
    }
  );
  const updateResult = await Promise.all(
    leasesList.map((missingRecord) => {
      return syncStripeSubscription(missingRecord, commit);
    })
  );
  const successfullUpdates = updateResult.filter(
    (result) => result.status === "done"
  );
  const failedUpdates = updateResult.filter(
    (result) => result.status === "failed"
  );
  const skippedUpdates = updateResult.filter(
    (result) => result.status === "skipped"
  );

  if (successfullUpdates.length > 0) {
    report.logProgress<LeasesView>(
      "Success:",
      `Successfully updated ${origin} stripe subscriptions`,
      "success",
      {
        data: successfullUpdates.map((result) => result.target),
        reportFields: [
          "status",
          "id",
          "roomId",
          "houseId",
          "houseName",
          "firstName",
          "lastName",
          "stripeCustomerId",
          "stripeProductId",
          "stripeSubscriptionId",
        ],
      }
    );
  }

  if (failedUpdates.length > 0) {
    report.logProgress<LeasesView & { message?: string }>(
      "Failed:",
      `${origin} stripe subscriptions`,
      "failure",
      {
        data: failedUpdates.map((result) => ({
          ...result.target,
          message: result.message,
        })),
        reportFields: [
          "status",
          "id",
          "roomId",
          "houseId",
          "houseName",
          "firstName",
          "lastName",
          "stripeCustomerId",
          "stripeProductId",
          "stripeSubscriptionId",
          "message",
        ],
      }
    );
  }
  if (skippedUpdates.length > 0) {
    report.logProgress<LeasesView & { message: string }>(
      "Skipped:",
      `${origin} stripe subscriptions`,
      "warning",
      {
        data: skippedUpdates.map((result) => ({
          ...result.target,
          message: "SKIPPED",
        })),
        reportFields: [
          "status",
          "id",
          "roomId",
          "houseId",
          "houseName",
          "firstName",
          "lastName",
          "stripeCustomerId",
          "stripeProductId",
          "stripeSubscriptionId",
          "message",
        ],
      }
    );
  }
  return {
    done: successfullUpdates.length,
    failed: failedUpdates.length,
    skipped: skippedUpdates.length,
  };
}

export {
  checkStripeSubscriptions,
  processLeases,
  syncStripeSubscription,
  reportInvalidLeases,
};
