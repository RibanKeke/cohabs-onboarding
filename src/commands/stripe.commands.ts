import { ConnectionPool } from "@databases/mysql";
import Stripe from "stripe";
import { leases, rooms } from "../database/database";

async function syncUsers() {
    console.log('Hello');
}

async function syncStripeProducts() {
    console.log('Hello');
}

async function syncStripeSubscriptions() {
    console.log('Hello');
}

export { syncUsers, syncStripeProducts, syncStripeSubscriptions };
