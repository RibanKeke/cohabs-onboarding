import { rooms, Rooms } from "./models";
import { DatabaseService } from "./database";
import { sql } from "@databases/mysql";

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
  const result = (await db.query(
    sql`
    select
      r.id ,
      r.active ,
      r.deleted ,
      r.location ,
      r.description ,
      r.rent ,
      r.stripeProductId,
      r.lockId ,
      h.id as houseId
    from
      rooms r
    left join houses h on
      h.id = r.houseId
    where r.active = 1 ;
`
  )) as Array<Rooms>;
  return result;
}

export { updateRoom, findRoomByStripeProductId, listCohabRooms };
