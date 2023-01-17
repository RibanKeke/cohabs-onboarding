import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Stripe from 'stripe';
import { updateStripeSubscriptionMissingLink, processMissingTransfersOnCharges } from './commands/stripe.commands';
import prompts from 'prompts';
import { Logger } from 'tslog';
import { initDatabase } from './database';

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

  const commands = await prompts<'choice'>({
    type: 'select',
    name: 'choice',
    message: 'Select command to execute',
    choices: [
      { title: 'Transfer Rents', description: 'Tranfer rents missing transfer group', value: 0 },
    ],
    initial: 0
  })

  switch (commands.choice) {
    case 0:
      await processMissingTransfersOnCharges(db, stripe, stripeAccount)
      break;
    default:
      break;
  }
  await db.dispose();
})();
