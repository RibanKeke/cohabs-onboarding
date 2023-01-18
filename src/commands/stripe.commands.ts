import { ConnectionPool } from "@databases/mysql";
import Stripe from "stripe";
import { leases, rooms } from "../database/database";

async function syncUsers(db: ConnectionPool, stripe: Stripe) {
    console.log('Hello');
}

async function syncStripeProducts(db: ConnectionPool, stripe: Stripe) {
    const cohabRooms = await rooms(db).find({ active: 1 }).all();
    const listStripeProducts = (await stripe.products.list()).data;
    const productsIds = listStripeProducts.map(c => c.id);
    const missingProducts = cohabRooms.filter(cu => !productsIds.includes(cu.id));
    console.log('Missing', missingProducts);
}

async function syncStripeSubscriptions(db: ConnectionPool, stripe: Stripe) {
    const cohabLeases = await leases(db).find({ status: 'active' }).all();
    const cohabSubscriptions = (await stripe.subscriptions.list()).data;
    const subscriptionIds = cohabSubscriptions.map(c => c.id);
    const missingSubscriptions = cohabLeases.filter(cu => !subscriptionIds.includes(cu.id));
    console.log('Missing', missingSubscriptions);
}

export { syncUsers, syncStripeProducts, syncStripeSubscriptions };
