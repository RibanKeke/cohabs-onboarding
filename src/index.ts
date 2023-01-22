import process from "node:process";
import * as dotenv from "dotenv";
import prompts from "prompts";
import {
  syncRooms,
  syncStripeSubscriptions,
  syncUsers,
} from "./commands/stripe.commands";
import { initializeStripe } from "./stripe";
import Report from "./utils";
import { initializeDatabase } from "./database";
import report from "./utils";

dotenv.config({ path: ".env" });

(async () => {
  const db = initializeDatabase({
    host: String(process.env.DB_HOST),
    port: Number(process.env.DB_PORT),
    user: String(process.env.DB_USER),
    password: String(process.env.DB_PASSWORD),
    database: "cohabs_onboarding",
  });
  initializeStripe(
    String(process.env.STRIPE_SECRET_KEY),
    String(process.env.STRIPE_ACCOUNT)
  );

  Report.logProgress(
    "Sync Script",
    "Check and sync cohabs users and products to Stripe",
    "start"
  );

  // Prompt user to select command to execute
  const commands = await prompts<"choice">({
    type: "select",
    name: "choice",
    message: "Select command to execute",
    choices: [
      {
        title: "Sync stripe customers",
        description: "Check and sync users to stripe customers",
        value: 0,
      },
      {
        title: "Sync stripe products",
        description: "Check and sync rooms to stripe products",
        value: 1,
      },
      {
        title: "Sync stripe subscriptions",
        description: "Check and sync leases to stripe subscriptions",
        value: 2,
      },
    ],
    initial: 0,
  });

  switch (commands.choice) {
    case 0: {
      await syncUsers(false);
      break;
    }

    case 1: {
      await syncRooms(true);
      break;
    }

    case 2: {
      await syncStripeSubscriptions();
      break;
    }

    default: {
      break;
    }
  }
  console.log(report.getReport());
  await db.dispose();
})();
