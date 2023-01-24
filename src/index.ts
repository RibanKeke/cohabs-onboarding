import * as dotenv from "dotenv";
import fs from "fs";
import prompts from "prompts";
import report from "./utils";
import { initializeDatabase } from "./database";
import { initializeStripe } from "./stripe";
import process from "node:process";
import {
  runAll,
  syncLeases,
  syncRooms,
  syncUsers,
} from "./commands/stripe.commands";

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

  report.logProgress(
    "Sync Script",
    "Check and sync cohabs users and products to Stripe",
    "start"
  );

  const { confirm } = await prompts<"confirm">({
    type: "confirm",
    name: "confirm",
    message: "To run the command in  commit mode,\nplease confirm?",
    initial: false,
  });

  if (confirm) {
    report.logProgress(
      "ATTENTION",
      "All detected missing links will be created and added to \n the database",
      "danger"
    );
  }

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
      {
        title: "Rull all check",
        description: "Runs all the check in sequence users -> rooms -> leases",
        value: 3,
      },
      {
        title: "Cancel",
        description: "Cancel execution",
        value: 4,
      },
    ],
    initial: 0,
  });

  switch (commands.choice) {
    case 0: {
      await syncUsers(confirm);
      break;
    }

    case 1: {
      await syncRooms(confirm);
      break;
    }

    case 2: {
      await syncLeases(confirm);
      break;
    }
    case 3: {
      await runAll(confirm);
      break;
    }

    default: {
      break;
    }
  }
  if (commands.choice !== 4) {
    fs.writeFileSync(
      `./reports/cohabs-stripe-report-${new Date().toISOString()}.txt`,
      report.getReport().join("\n")
    );
  }
  await db.dispose();
})();
