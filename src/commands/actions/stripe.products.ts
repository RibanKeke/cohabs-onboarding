import {
  findRoomByStripeProductId,
  listCohabRooms,
  Rooms,
  updateRoom,
} from "../../database";
import {
  createStripeProduct,
  listStripeProducts,
  NewStripeProduct,
} from "../../stripe";
import report from "../../utils";
import {
  ExecutionRecord,
  ExecutionStats,
  RecordStatus,
  RecordSummary,
  RoomsSummary,
  UpdateResult,
} from "../interfaces/commands.interface";

function checkRoom(
  cohabRoom: Rooms,
  stripeProductIds: Array<string>
): { missing: boolean; broken: boolean; synced: boolean } {
  const missing = cohabRoom.stripeProductId === null;
  const broken =
    cohabRoom.stripeProductId !== null &&
    !stripeProductIds.includes(cohabRoom.stripeProductId);
  const synced =
    Boolean(cohabRoom.houseId) &&
    Boolean(cohabRoom.stripeProductId) &&
    stripeProductIds.includes(cohabRoom?.stripeProductId ?? "");
  return {
    missing,
    broken,
    synced,
  };
}

function checkVerifiedRooms(
  verifiedRooms: Array<Rooms>,
  productIds: Array<string>
): RoomsSummary {
  const roomsSummary = verifiedRooms.reduce(
    (result, cohabRoom) => {
      const { missing, broken, synced } = checkRoom(cohabRoom, productIds);

      if (missing) {
        const roomExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "new",
          item: cohabRoom,
        };
        return {
          ...result,
          missing: [...result.missing, roomExecutionRecord],
        };
      }

      if (synced) {
        const roomExecutionRecord: ExecutionRecord<Rooms> = {
          message: "",
          status: "done",
          item: cohabRoom,
        };
        return {
          ...result,
          synced: [...result.synced, roomExecutionRecord],
        };
      }

      if (broken) {
        const roomExecutionRecord: ExecutionRecord<Rooms> = {
          message: "Rooms's product id is missing in stripe",
          status: "new",
          item: cohabRoom,
        };
        const invalidResult: RecordSummary<Rooms> = [
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
    { missing: [], invalid: [], broken: [], synced: [] } as RoomsSummary
  );
  return roomsSummary;
}

function filterRoomsMissingHouseId(rooms: Array<Rooms>) {
  return rooms
    .filter((room) => room.houseId === null)
    .map((room) => {
      const executionRecord: ExecutionRecord<Rooms> = {
        item: room,
        message: "Invalid link to houseId",
        status: "new",
      };
      return executionRecord;
    });
}

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
  const roomsMissingHouseId = filterRoomsMissingHouseId(cohabsRooms);
  const verifiedRooms = cohabsRooms.filter((room) => room.houseId !== null);
  const productIds = stripeProducts.map((c) => c.id);
  const roomsCount = cohabsRooms.length;
  const roomsSummary = checkVerifiedRooms(verifiedRooms, productIds);
  return {
    roomsCount,
    roomsSummary: { ...roomsSummary, invalid: roomsMissingHouseId },
  };
}

/**
 * Create new stripe product and update cohab room with new stripeProductId
 * @param cohabRoom Cohab room
 * @param commit Flag for commit
 * @returns UpdateResult<Rooms>
 */
async function syncStripeProduct(
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
      unit_amount: Number(String(cohabRoom.rent).split(".").join("")),
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

function reportInvalidRooms(
  invalidRooms: RecordSummary<Rooms>
): ExecutionStats {
  const roomsList: Array<Rooms & { message: string }> = invalidRooms.map(
    (executionRecord) => ({
      ...executionRecord.item,
      message: executionRecord.message,
    })
  );
  report.logProgress<Rooms & { message: string }>(
    "...Reporting:",
    "Invalid cohab products - These records are skipped \n Please fix the issue and run the script again.",
    "warning",
    {
      data: roomsList,
      reportFields: ["active", "id", "houseId", "stripeProductId", "message"],
    }
  );
  return { done: 0, failed: 0, skipped: roomsList.length };
}

async function processRooms(
  origin: RecordStatus,
  roomsSummary: RecordSummary<Rooms>,
  commit: boolean
): Promise<ExecutionStats> {
  const roomsList = roomsSummary.map((executionRecord) => executionRecord.item);
  if (roomsList.length === 0) {
    return {
      done: 0,
      failed: 0,
      skipped: 0,
    };
  }
  report.logProgress<Rooms>(
    "...Processing:",
    `${origin} stripe products`,
    "info",
    {
      data: roomsList,
      reportFields: ["active", "id", "location", "houseId", "stripeProductId"],
    }
  );
  const updateResult = await Promise.all(
    roomsList.map((missingRecord) => {
      return syncStripeProduct(missingRecord, commit);
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
      `Successfully updated ${origin} stripe products`,
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
      `${origin} stripe products`,
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
          "rent",
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
      `${origin} stripe products`,
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

export {
  checkStripeProducts,
  processRooms,
  syncStripeProduct,
  reportInvalidRooms,
};
