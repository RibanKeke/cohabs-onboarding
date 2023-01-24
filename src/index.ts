import * as dotenv from "dotenv";
import fs from "fs";
import report from "./utils";
import { initializeDatabase } from "./database";
import { initializeStripe } from "./stripe";
import process from "node:process";
import { confirmCommit, selectCommands } from "./utils/prompts";
import COMMANDS from "./commands";

dotenv.config({ path: ".env" });

(async () => {
  // Initialization
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
    "STARTED: Sync Script",
    "Check and sync cohabs users and products to Stripe",
    "start"
  );
  // Request user confirmation for commit mode
  const { confirm } = await confirmCommit();
  if (confirm) {
    report.logProgress(
      "ATTENTION",
      "All detected missing links will be created and added to \n the database",
      "danger"
    );
  }

  // Prompt to user available commands and excute selected command defined in COMMANDS
  await selectCommands(COMMANDS, confirm)
    .catch((err) => {
      // Log any unexpected error and print report
      const errorPayload: { message: string; stack: string } = {
        message: err.message,
        stack: JSON.stringify(err.stack),
      };
      report.logProgress<typeof errorPayload>(
        "CRITICAL ERROR",
        "An unexpected error occured",
        "danger",
        { data: [errorPayload], reportFields: ["message", "stack"] }
      );
      fs.writeFileSync(
        `./reports/cohabs-stripe-report-${new Date().toISOString()}.error`,
        report.getReport().join("\n")
      );
    })
    .then((command) => {
      // Skip execution report print when the script is cancelled
      if (command?.choice !== 4) {
        fs.writeFileSync(
          `./reports/cohabs-stripe-report-${new Date().toISOString()}.txt`,
          report.getReport().join("\n")
        );
      }
    });

  // Close database
  await db.dispose();
})();
