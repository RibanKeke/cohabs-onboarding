import { findUserByStripeCustomerId, updateUser, Users } from "../../database";
import { listCohabUsers } from "../../database/users";
import {
  NewStripeCustomer,
  createStripeCustomer,
  listStripeCustomers,
} from "../../stripe";
import report from "../../utils";
import {
  ExecutionRecord,
  ExecutionStats,
  RecordStatus,
  RecordSummary,
  UpdateResult,
  UsersSummary,
} from "../interfaces/commands.interface";

/**
 * Check if cohab tenant has linked stripe customer
 * @param cohabsUsers Existing cohabs users
 * @param stripeCustomers Existing stripe customers
 * @returns
 */
async function checkStripeUsers(): Promise<{
  usersSummary: UsersSummary;
  usersCount: number;
}> {
  const stripeCustomers = await listStripeCustomers();
  const cohabsUsers = await listCohabUsers();
  const customersIds = stripeCustomers.map((c) => c.id);
  const usersCount = cohabsUsers.length;
  const usersSummary = cohabsUsers.reduce(
    (result, cohabUser) => {
      const { missing, invalid }: { missing: boolean; invalid: boolean } =
        cohabUser.stripeCustomerId === null
          ? { missing: true, invalid: false }
          : customersIds.includes(cohabUser.stripeCustomerId)
          ? { missing: false, invalid: false }
          : { missing: false, invalid: true };

      if (missing) {
        const userExecutionRecord: ExecutionRecord<Users> = {
          message: "",
          status: "new",
          item: cohabUser,
        };
        return {
          ...result,
          missing: { ...result.missing, [cohabUser.id]: userExecutionRecord },
        };
      }

      if (invalid) {
        const userExecutionRecord: ExecutionRecord<Users> = {
          message: "",
          status: "new",
          item: cohabUser,
        };
        const invalidResult = {
          ...result.invalid,
          [cohabUser.id]: userExecutionRecord,
        };
        return {
          ...result,
          invalid: invalidResult,
        };
      }
      return result;
    },
    { missing: {}, invalid: {}, broken: {}, synced: {} } as UsersSummary
  );
  return { usersCount, usersSummary };
}

/**
 * Create new stripe use and update cohabUser with new stripeCustomerId
 * @param cohabUser Cohab user
 * @param commit Flag for commit
 * @returns UpdateResult<Users>
 */
async function syncStripeUser(
  cohabUser: Users,
  commit: boolean
): Promise<UpdateResult<Users>> {
  const stripeUser: NewStripeCustomer = {
    description: cohabUser.about ?? "New cohab stripe user",
    email: cohabUser.email,
    name: `${cohabUser.firstName} ${cohabUser.lastName}`,
    phone: cohabUser.phoneNumber ?? "",
    metadata: {
      cohabUserId: cohabUser.id,
    },
  };
  const execute = async () => {
    const newStripeUser = await createStripeCustomer(stripeUser);
    await updateUser(cohabUser.id, { stripeCustomerId: newStripeUser.id });
    const updatedUser = await findUserByStripeCustomerId(newStripeUser.id);
    if (updatedUser) {
      return updatedUser;
    } else {
      throw new Error(`Updated user with id: ${cohabUser.id} was not found`);
    }
  };
  if (commit) {
    return await execute()
      .then((updatedUser) => {
        const successResult: UpdateResult<Users> = {
          id: updatedUser.id,
          status: "done",
          target: updatedUser,
        };
        return successResult;
      })
      .catch((err) => {
        const failedResult: UpdateResult<Users> = {
          id: cohabUser?.id,
          status: "failed",
          target: cohabUser,
          message: err.message,
        };
        return failedResult;
      });
  } else {
    const simResult: UpdateResult<Users> = {
      id: cohabUser?.id,
      status: "skipped",
      target: cohabUser,
    };
    return simResult;
  }
}

async function processUsers(
  origin: RecordStatus,
  users: RecordSummary<Users>,
  commit: boolean
): Promise<ExecutionStats> {
  const usersList = Object.values(users).map(
    (executionRecord) => executionRecord.item
  );
  if (usersList.length === 0) {
    return {
      done: 0,
      failed: 0,
      skipped: 0,
    };
  }
  report.logProgress<Users>(
    "...Processing:",
    `${origin} stripe users`,
    "info",
    {
      data: usersList,
      reportFields: [
        "active",
        "id",
        "firstName",
        "lastName",
        "stripeCustomerId",
      ],
    }
  );
  const updateResult = await Promise.all(
    usersList.map((missingRecord) => {
      return syncStripeUser(missingRecord, commit);
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
    report.logProgress<Users>(
      "Success:",
      `Successfully updated ${origin} stripe users`,
      "success",
      {
        data: successfullUpdates.map((result) => result.target),
        reportFields: [
          "active",
          "id",
          "firstName",
          "lastName",
          "stripeCustomerId",
        ],
      }
    );
  }

  if (failedUpdates.length > 0) {
    report.logProgress<Users & { message?: string }>(
      "Failed:",
      `${origin} stripe users`,
      "danger",
      {
        data: failedUpdates.map((result) => ({
          ...result.target,
          message: result.message,
        })),
        reportFields: [
          "active",
          "id",
          "firstName",
          "lastName",
          "stripeCustomerId",
          "message",
        ],
      }
    );
  }
  if (skippedUpdates.length > 0) {
    report.logProgress<Users & { message: string }>(
      "Skipped:",
      `${origin} stripe users`,
      "warning",
      {
        data: skippedUpdates.map((result) => ({
          ...result.target,
          message: "SKIPPED",
        })),
        reportFields: [
          "active",
          "id",
          "firstName",
          "lastName",
          "stripeCustomerId",
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

export { checkStripeUsers, processUsers, syncStripeUser };
