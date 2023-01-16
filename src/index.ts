import * as util from 'util';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Stripe from 'stripe';
import { createConnection, Connection } from 'mysql';

async function initDb(): Promise<Connection> {
  return createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: process.env.DB_PASSWORD,
    database: 'cohabs_onboarding'
  });
}

async function initStripe(): Promise<Stripe> {
  return new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15' });
}

(async () => {
  const stripe = await initStripe();
  const connection = await initDb();

  //@TODO: Add the solution here!
  console.log('I have started successfully');

  connection.end();
})();
