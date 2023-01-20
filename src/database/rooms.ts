import { rooms, Rooms } from "./models";
import { DatabaseService } from "./database";

async function updateRoom(id: string, updateValues: Partial<Rooms>) {
  const db = DatabaseService.getDb();
  return await rooms(db).update({ id }, updateValues);
}

async function findRoomByStripeProductId(stripeProductId: string) {
  const db = DatabaseService.getDb();
  return await rooms(db).findOne({ stripeProductId });
}

async function listCohabRooms() {
  const db = DatabaseService.getDb();
  return await rooms(db).find().all();
}

export { updateRoom, findRoomByStripeProductId, listCohabRooms };
