import { Entities } from ".";
import { DatabaseService } from "./database";

async function updateUser(id: string, updateValues: Partial<Entities.Users>) {
    const db = DatabaseService.getDb();
    return await Entities.users(db).update({ id }, updateValues);
}

async function findUserByStripeCustomerId(stripeCustomerId: string) {
    const db = DatabaseService.getDb();
    return await Entities.users(db).findOne({ stripeCustomerId })
}

async function listCohabUsers() {
    const db = DatabaseService.getDb();
    return await Entities.users(db).find().all();
}

export { updateUser, findUserByStripeCustomerId, listCohabUsers }