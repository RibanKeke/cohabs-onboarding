import { DatabaseService } from "./database";
import { findUserByStripeCustomerId, updateUser } from "./users";

import DatabaseSchema, { serializeValue } from '../__generated__';
import tables from '@databases/mysql-typed';

const { houses, leases, payments, users, rooms } = tables<DatabaseSchema>({
    serializeValue,
});

type Entities<T extends keyof DatabaseSchema> = DatabaseSchema[T]['record'];
type Houses = Entities<'houses'>;
type Leases = Entities<'leases'>;
type Payments = Entities<'payments'>;
type Rooms = Entities<'rooms'>;
type Users = Entities<'users'>;

const initializeDatabase = (options: {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}
) => DatabaseService.initialize(options)

const CohabUsers = {
    updateUser: updateUser,
    findUserByStripeCustomerId: findUserByStripeCustomerId
}

export {
    initializeDatabase,
    Houses,
    Leases,
    Payments,
    Rooms,
    Users,
    houses,
    leases,
    payments,
    users,
    rooms,
    updateUser,
    findUserByStripeCustomerId
}