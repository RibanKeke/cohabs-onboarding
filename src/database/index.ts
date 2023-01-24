import { DatabaseService } from "./impl";
import { findUserByStripeCustomerId, updateUser } from "./users";

/**
 * Initialize the database connection pool
 * @param options {    host: string; port: number; user: string; password: string; database: string;}
 * @returns ConnectionPool (@database/mysql)
 */
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
