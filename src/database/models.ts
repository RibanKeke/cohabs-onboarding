import DatabaseSchema, { serializeValue } from "../__generated__";
import tables from "@databases/mysql-typed";

const { houses, leases, payments, users, rooms } = tables<DatabaseSchema>({
  serializeValue,
});

type Entities<T extends keyof DatabaseSchema> = DatabaseSchema[T]["record"];
type Houses = Entities<"houses">;
type Leases = Entities<"leases">;
type Payments = Entities<"payments">;
type Rooms = Entities<"rooms">;
type Users = Entities<"users">;

type RoomsView = Pick<
  Leases,
  | "id"
  | "userId"
  | "startDate"
  | "endDate"
  | "rentAmount"
  | "name"
  | "stripeSubscriptionId"
  | "roomId"
> &
  Pick<Rooms, "stripeProductId" | "houseId"> &
  Pick<Users, "lastName" | "firstName" | "stripeCustomerId">;

export {
  Houses,
  Leases,
  Payments,
  Rooms,
  Users,
  RoomsView,
  houses,
  leases,
  payments,
  users,
  rooms,
};
