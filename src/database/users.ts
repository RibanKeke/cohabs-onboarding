import { ConnectionPool, Transaction } from "@databases/mysql";
import { users, Users } from "./database";



async function updateUser(id: string, updateValues: Partial<Users>, db: Transaction | ConnectionPool) {
    return await users(db).update({ id }, updateValues);
}

async function findUserByStripeCustomerId(stripeCustomerId: string, db: Transaction | ConnectionPool) {
    return await users(db).findOne({ stripeCustomerId })
}

export { updateUser, findUserByStripeCustomerId }