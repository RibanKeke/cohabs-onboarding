import {
  findUserByStripeCustomerId,
  Rooms,
  updateUser,
  Users,
} from "../../database";
import { listCohabRooms, updateRoom } from "../../database/rooms";
import { NewStripeCustomer, createStripeCustomer } from "../../stripe";
import { createStripeProduct, listStripeProducts } from "../../stripe/stripe";
import report from "../../utils";
import {
  ExecutionRecord,
  ExecutionStats,
  RecordStatus,
  RecordSummary,
  RoomsSummary,
  UpdateResult,
} from "../interfaces/commands.interface";

/**
 * Check if cohab room has linked stripe product
 * @param cohabsRooms Existing cohabs users
 * @param stripeProducts Existing stripe products
 * @returns
 */
async function checkStripeProducts(): Promise<{
  roomsSummary: RoomsSummary;
  roomsCount: number;
}> {
  const stripeProducts = await listStripeProducts();
  const cohabsRooms = await listCohabRooms();
  const productsIds = stripeProducts.map((c) => c.id);
  const roomsCount = cohabsRooms.length;
  const roomsSummary = cohabsRooms.reduce(
    (result, cohabRoom) => {
      const { missing, invalid }: { missing: boolean; invalid: boolean } =
        cohabRoom.stripeProductId === null
          ? { missing: true, invalid: false }
          : productsIds.includes(cohabRoom.stripeProductId)
          ? { missing: false, invalid: false }
          : { missing: false, invalid: true };

      if (missing) {
        const userExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "new",
          item: cohabRoom,
        };
        return {
          ...result,
          missing: { ...result.missing, [cohabRoom.id]: userExecutionRecord },
        };
      }

      if (invalid) {
        const userExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "new",
          item: cohabRoom,
        };
        const invalidResult = {
          ...result.invalid,
          [cohabRoom.id]: userExecutionRecord,
        };
        return {
          ...result,
          invalid: invalidResult,
        };
      }
      return result;
    },
    { missing: {}, invalid: {}, broken: {}, synced: {} } as RoomsSummary
  );
  return { roomsCount, roomsSummary };
}

/**
 * Create new stripe product and update cohab room with new stripeProductId
 * @param cohabRoom Cohab room
 * @param commit Flag for commit
 * @returns UpdateResult<Users>
 */
async function syncStripeRoom(
  cohabRoom: Users,
  commit: boolean
): Promise<UpdateResult<Users>> {
  const stripeProductId: NewStripeCustomer = {
  };
  const execute = async () => {
    const newStripeProduct = await createStripeProduct(stripeProductId);
    await updateRoom(cohabUser.id, { stripeCustomerId: newStripeUser.id });
    const updatedUser = await findUserByStripeCustomerId(newStripeUser.id);
    if (updatedUser) {
      return updatedUser;
    } else {
      throw new Error(`User to update with id: ${cohabUser.id} as not found`);
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

export { checkStripeProducts, processUsers, syncStripeUser };
