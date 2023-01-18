import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Stripe from 'stripe';
import { syncStripeProducts, syncStripeSubscriptions, syncUsers } from './commands/stripe.commands';
import prompts from 'prompts';
import { Logger } from 'tslog';
import { initDatabase } from './database/database';

async function initStripe(): Promise<Stripe> {
  return new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15', stripeAccount: process.env.STRIPE_ACCOUNT });
}

(async () => {
  const log = new Logger();
  const stripe = await initStripe();
  const stripeAccount = String(process.env.STRIPE_ACCOUNT);
  const db = initDatabase({
    host: String(process.env.DB_HOST),
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: String(process.env.DB_PASSWORD),
    database: 'cohabs_onboarding'
  });

  // Prompt user to select command to execute
  const commands = await prompts<'choice'>({
    type: 'select',
    name: 'choice',
    message: 'Select command to execute',
    choices: [
      { title: 'Sync stripe customers', description: 'Check and sync users to stripe customers', value: 0 },
      { title: 'Sync stripe products', description: 'Check and sync rooms to stripe products', value: 1 },
      { title: 'Sync stripe subscriptions', description: 'Check and sync leases to stripe subscriptions', value: 2 },
    ],
    initial: 0
  })

  switch (commands.choice) {
    case 0:
      await syncUsers(db, stripe)
      break;
    case 1:
      await syncStripeProducts(db, stripe)
      break;
    case 2:
      await syncStripeSubscriptions(db, stripe)
      break;
    default:
      break;
  }
  await db.dispose();
})();
