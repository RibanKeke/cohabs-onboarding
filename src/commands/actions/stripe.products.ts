import {
  findRoomByStripeProductId,
  listCohabRooms,
  Rooms,
  updateRoom,
} from "../../database";
import {
  createStripeProduct,
  getStripeCustomer,
  NewStripeProduct,
} from "../../stripe";
import report from "../../utils";
import {
  CheckResult,
  ExecutionStats,
  RecordStatus,
  RoomsSummary,
  UpdateResult,
} from "../commands.interface";

async function checkProductLink(
  cohabRooms: Array<Rooms>
): Promise<RoomsSummary> {
  const execute = async (cohabRoom: Rooms): Promise<CheckResult<Rooms>> => {
    try {
      const stripeCustomer = await getStripeCustomer(cohabRoom.id);
      if (stripeCustomer?.deleted || stripeCustomer?.id === null) {
        return {
          item: cohabRoom,
          status: "broken",
          message: "Customer missing or deleted",
        };
      }
      return {
        item: cohabRoom,
        status: "synced",
      };
    } catch (error) {
      return {
        item: cohabRoom,
        status: "error",
        message: (error as Error).message,
      };
    }
  };

  const results = await Promise.all(
    cohabRooms.map((cohabRoom) => execute(cohabRoom))
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
 * Check if cohab room has linked stripe product
 * @param cohabsRooms Existing cohabs users
 * @param stripeProducts Existing stripe products
 * @returns
 */
async function checkStripeProducts(): Promise<{
  roomsSummary: RoomsSummary;
  roomsCount: number;
}> {
  const cohabsRooms = await listCohabRooms();
  const roomsCount = cohabsRooms.length;
  const missing = cohabsRooms
    .filter(
      (cohabRoom) =>
        cohabRoom.stripeProductId === null || cohabRoom.stripeProductId === ""
    )
    .map(
      (cohabRoom) =>
        ({ status: "missing", item: cohabRoom } as CheckResult<Rooms>)
    );
  const validRooms = cohabsRooms.filter(
    (cohabRoom) =>
      cohabRoom.stripeProductId !== null && cohabRoom.houseId !== null
  );
  const invalid = cohabsRooms
    .filter(
      (cohabRoom) =>
        cohabRoom.stripeProductId === null && cohabRoom.houseId === null
    )
    .map(
      (cohabRoom) =>
        ({ status: "invalid", item: cohabRoom } as CheckResult<Rooms>)
    );

  const { broken, synced, error } = await checkProductLink(validRooms);

  return {
    roomsCount,
    roomsSummary: { missing, broken, invalid, synced, error },
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
  invalidRooms: Array<CheckResult<Rooms>>
): ExecutionStats {
  const roomsList: Array<Rooms & { message?: string }> = invalidRooms.map(
    (executionRecord) => ({
      ...executionRecord.item,
      message: executionRecord.message,
    })
  );
  report.logProgress<Rooms & { message?: string }>(
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
  roomsList: Array<Rooms>,
  commit: boolean
): Promise<ExecutionStats> {
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
      "failure",
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
