import * as util from 'util';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import Stripe from 'stripe';
import { createConnection, Connection } from 'mysql';
import { updateStripeSubscriptionMissingLink, tranferMissingPaymentsTransport } from './commands/stripe.commands';
import prompts from 'prompts';
import { Logger } from 'tslog';
import { initDatabase } from './database';

async function initStripe(): Promise<Stripe> {
  return new Stripe(String(process.env.STRIPE_SECRET_KEY), { apiVersion: '2022-11-15' });
}

(async () => {
  const log = new Logger();
  const stripe = await initStripe();
  const stripeAccount = String(process.env.STRIPE_ACCOUNT);
  const tranferGroup = String(process.env.STRIPE_TRANSFER_GROUP);
  const db = initDatabase({
    host: String(process.env.DB_HOST),
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: String(process.env.DB_PASSWORD),
    database: 'cohabs_onboarding'
  });

  const response = await prompts<'confirm'>({
    type: 'confirm',
    name: 'confirm',
    message: 'Can you confirm?',
    initial: false
  });

  const commands = await prompts<'choice'>({
    type: 'select',
    name: 'choice',
    message: 'Select command to execute',
    choices: [
      { title: 'Transfer Rents', description: 'Tranfer rents missing transfer group', value: 1 },
      { title: 'Sync subscriptions', description: 'Tranfer rents missing transfer group', value: 2 },
    ],
    initial: 1
  })

  switch (commands.choice) {
    case 1:
      await tranferMissingPaymentsTransport(db, stripe, stripeAccount, tranferGroup, response.confirm)
      break;
    case 2:
      await updateStripeSubscriptionMissingLink(db, stripe, response.confirm);
      break;
    default:
      break;
  }
  await db.dispose();
})();
