import { DatabaseService } from "./impl";

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
export { initializeDatabase };
export { listUsers, updateUser, findUserByStripeCustomerId } from "./users";
export { findRoomByStripeProductId, listCohabRooms, updateRoom } from "./rooms";
export {
  findLeaseByStripeSubscriptionId,
  listCohabLeases,
  updateLease,
} from "./leases";
export { Houses, Leases, Payments, Rooms, Users, LeasesView } from "./models";
