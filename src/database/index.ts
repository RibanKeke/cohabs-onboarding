import { DatabaseService } from "./database";
import { findUserByStripeCustomerId, updateUser } from "./users";

const initializeDatabase = (options: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) => DatabaseService.initialize(options);

export { findRoomByStripeProductId, listCohabRooms, updateRoom } from "./rooms";
export {
  findLeaseByStripeSubscriptionId,
  listCohabLeases,
  updateLease,
} from "./leases";

export { initializeDatabase, updateUser, findUserByStripeCustomerId };
export { Houses, Leases, Payments, Rooms, Users, LeasesView } from "./models";
