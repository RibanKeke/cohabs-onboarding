import {
  findUserByStripeCustomerId,
  listUsers,
  updateUser,
  Users,
} from "../../database";
import {
  NewStripeCustomer,
  createStripeCustomer,
  attachCustomerToPaymentMethod,
  createCustomerPaymentMethod,
  updateStripeCustomer,
  getStripeCustomer,
} from "../../stripe";
import report from "../../utils";
import {
  CheckResult,
  ExecutionStats,
  RecordStatus,
  UpdateResult,
  UsersSummary,
} from "../commands.interface";

async function checkCustomerLink(
  cohabUsers: Array<Users>
): Promise<UsersSummary> {
  const execute = async (
    cohabUser: Required<Users>
  ): Promise<CheckResult<Users>> => {
    try {
      const stripeCustomer = await getStripeCustomer(
        cohabUser.stripeCustomerId ?? ""
      );
      if (stripeCustomer?.deleted || stripeCustomer?.id === null) {
        return {
          item: cohabUser,
          status: "broken",
          message: "Customer missing or deleted",
        };
      }
      return {
        item: cohabUser,
        status: "synced",
      };
    } catch (error) {
      return {
        item: cohabUser,
        status: "error",
        message: (error as Error).message,
      };
    }
  };

  const results = await Promise.all(
    cohabUsers.map((cohabUser) => execute(cohabUser))
  );
  const broken = results.filter(
    (resultItem) => resultItem?.status === "broken"
  );

  const synced = results.filter(
    (resultItem) => resultItem?.status === "synced"
  );

  const error = results.filter((resultItem) => resultItem?.status === "error");

  return {
    broken,
    error,
    synced,
    invalid: [],
    missing: [],
  };
}

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
  const cohabsUsers = await listUsers();
  const usersCount = cohabsUsers.length;
  const missing = cohabsUsers
    .filter(
      (cohabUser) =>
        cohabUser.stripeCustomerId === null || cohabUser.stripeCustomerId === ""
    )
    .map(
      (cohabUser) =>
        ({ status: "missing", item: cohabUser } as CheckResult<Users>)
    );
  const validUsers = cohabsUsers.filter(
    (cohabUser) =>
      cohabUser.stripeCustomerId !== null && cohabUser.stripeCustomerId !== ""
  );

  const { broken, synced, error } = await checkCustomerLink(validUsers);

  return {
    usersCount,
    usersSummary: { missing, broken, invalid: [], synced, error },
  };
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
    const paymentMethod = await createCustomerPaymentMethod("card");
    const stripeCustomer = await createStripeCustomer(stripeUser);
    await attachCustomerToPaymentMethod(paymentMethod.id, stripeCustomer.id);
    await updateStripeCustomer(stripeCustomer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
    await updateUser(cohabUser.id, { stripeCustomerId: stripeCustomer.id });
    const updatedUser = await findUserByStripeCustomerId(stripeCustomer.id);
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
  recordItems: Array<Users>,
  commit: boolean
): Promise<ExecutionStats> {
  if (recordItems.length === 0) {
    return {
      done: 0,
      failed: 0,
      skipped: 0,
    };
  }
  report.logProgress<Users>(
    "...Processing:",
    `${origin} stripe customers`,
    "info",
    {
      data: recordItems,
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
    recordItems.map((cohabUser) => {
      return syncStripeUser(cohabUser, commit);
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
      `Successfully updated ${origin} stripe customers`,
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
      `${origin} stripe customers`,
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
      `${origin} stripe customers`,
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
