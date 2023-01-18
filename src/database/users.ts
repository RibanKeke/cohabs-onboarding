import { users, Users } from ".";
import { DatabaseService } from "./database";

async function updateUser(id: string, updateValues: Partial<Users>) {
    const db = DatabaseService.getDb();
    return await users(db).update({ id }, updateValues);
}

async function findUserByStripeCustomerId(stripeCustomerId: string) {
    const db = DatabaseService.getDb();
    return await users(db).findOne({ stripeCustomerId })
}

export { updateUser, findUserByStripeCustomerId }