import { users, Users } from "./models";
import { DatabaseService } from "./impl";

async function updateUser(id: string, updateValues: Partial<Users>) {
  const db = DatabaseService.getDb();
  return await users(db).update({ id }, updateValues);
}

async function findUserByStripeCustomerId(stripeCustomerId: string) {
  const db = DatabaseService.getDb();
  return await users(db).findOne({ stripeCustomerId });
}

async function listUsers() {
  const db = DatabaseService.getDb();
  return await users(db).find().all();
}

export { updateUser, findUserByStripeCustomerId, listUsers };
