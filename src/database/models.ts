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

export {
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
}