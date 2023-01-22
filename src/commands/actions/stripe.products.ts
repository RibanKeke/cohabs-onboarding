import { Rooms } from "../../database";
import {
  findRoomByStripeProductId,
  listCohabRooms,
  updateRoom,
} from "../../database/rooms";
import {
  createStripeProduct,
  listStripeProducts,
  NewStripeProduct,
} from "../../stripe/stripe";
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
        const roomExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "new",
          item: cohabRoom,
        };
        return {
          ...result,
          missing: { ...result.missing, [cohabRoom.id]: roomExecutionRecord },
        };
      }

      if (invalid) {
        const roomExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "new",
          item: cohabRoom,
        };
        const invalidResult = {
          ...result.invalid,
          [cohabRoom.id]: roomExecutionRecord,
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
 * @returns UpdateResult<Rooms>
 */
async function syncStripeRoom(
  cohabRoom: Rooms,
  commit: boolean
): Promise<UpdateResult<Rooms>> {
  const stripeProduct: NewStripeProduct = {
    name: cohabRoom.location ?? "",
    description: cohabRoom.description ?? "",
    metadata: {
      cohabRoomId: cohabRoom.id,
    },
    active: true,
    default_price_data: {
      currency: "eur",
      recurring: {
        interval: "month",
      },
      unit_amount: Number(cohabRoom.rent),
      unit_amount_decimal: "0",
    },
  };
  const execute = async () => {
    const newStripeProduct = await createStripeProduct(stripeProduct);
    await updateRoom(cohabRoom.id, { stripeProductId: newStripeProduct.id });
    const updatedProduct = await findRoomByStripeProductId(newStripeProduct.id);
    if (updatedProduct) {
      return updatedProduct;
    } else {
      throw new Error(`Room to update with id: ${cohabRoom.id} was not found`);
    }
  };
  if (commit) {
    return await execute()
      .then((updatedRoom) => {
        const successResult: UpdateResult<Rooms> = {
          id: updatedRoom.id,
          status: "done",
          target: updatedRoom,
        };
        return successResult;
      })
      .catch((err) => {
        const failedResult: UpdateResult<Rooms> = {
          id: cohabRoom?.id,
          status: "failed",
          target: cohabRoom,
          message: err.message,
        };
        return failedResult;
      });
  } else {
    const simResult: UpdateResult<Rooms> = {
      id: cohabRoom?.id,
      status: "skipped",
      target: cohabRoom,
    };
    return simResult;
  }
}

async function processRooms(
  origin: RecordStatus,
  rooms: RecordSummary<Rooms>,
  commit: boolean
): Promise<ExecutionStats> {
  const roomsList = Object.values(rooms).map(
    (executionRecord) => executionRecord.item
  );
  if (roomsList.length === 0) {
    return {
      done: 0,
      failed: 0,
      skipped: 0,
    };
  }
  report.logProgress<Rooms>(
    "...Processing:",
    `${origin} stripe rooms`,
    "info",
    {
      data: roomsList,
      reportFields: ["active", "id", "location", "houseId", "stripeProductId"],
    }
  );
  const updateResult = await Promise.all(
    roomsList.map((missingRecord) => {
      return syncStripeRoom(missingRecord, commit);
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
    report.logProgress<Rooms>(
      "Success:",
      `Successfully updated ${origin} stripe rooms`,
      "success",
      {
        data: successfullUpdates.map((result) => result.target),
        reportFields: [
          "active",
          "id",
          "location",
          "houseId",
          "stripeProductId",
        ],
      }
    );
  }

  if (failedUpdates.length > 0) {
    report.logProgress<Rooms & { message?: string }>(
      "Failed:",
      `${origin} stripe rooms`,
      "danger",
      {
        data: failedUpdates.map((result) => ({
          ...result.target,
          message: result.message,
        })),
        reportFields: [
          "active",
          "id",
          "location",
          "houseId",
          "stripeProductId",
          "message",
        ],
      }
    );
  }
  if (skippedUpdates.length > 0) {
    report.logProgress<Rooms & { message: string }>(
      "Skipped:",
      `${origin} stripe rooms`,
      "warning",
      {
        data: skippedUpdates.map((result) => ({
          ...result.target,
          message: "SKIPPED",
        })),
        reportFields: [
          "active",
          "id",
          "location",
          "houseId",
          "stripeProductId",
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

export { checkStripeProducts, processRooms, syncStripeRoom };
