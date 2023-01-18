import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { syncStripeProducts, syncStripeSubscriptions, syncUsers } from './commands/stripe.commands';
import prompts from 'prompts';
import { DatabaseService } from './database/database';
import { initializeStripe } from './stripe';


(async () => {

  const db = DatabaseService.initialize({
    host: String(process.env.DB_HOST),
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: String(process.env.DB_PASSWORD),
    database: 'cohabs_onboarding'
  });
  initializeStripe(String(process.env.STRIPE_SECRET_KEY), String(process.env.STRIPE_ACCOUNT))

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
      await syncUsers()
      break;
    case 1:
      await syncStripeProducts()
      break;
    case 2:
      await syncStripeSubscriptions()
      break;
    default:
      break;
  }
  await db.dispose();
})();
