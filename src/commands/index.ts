import { Choice } from "../utils/prompts";
import { syncAll, syncLeases, syncRooms, syncUsers } from "./stripe.commands";

const COMMANDS: Array<Choice> = [
  {
    title: "Sync cohab users",
    description: "Check and sync users to stripe customers",
    call: syncUsers,
  },
  {
    title: "Sync cohab rooms",
    description: "Check and sync rooms to stripe products",
    call: syncRooms,
  },
  {
    title: "Sync cohab leases",
    description: "Check and sync leases to stripe subscriptions",
    call: syncLeases,
  },
  {
    title: "Rull all checks",
    description: "Runs all the check in sequence: users -> rooms -> leases",
    call: syncAll,
  },
  {
    title: "Cancel",
    description: "Cancel execution",
  },
];

export default COMMANDS;
