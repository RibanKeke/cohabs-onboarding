
import createConnectionPool, { ConnectionPool } from '@databases/mysql';
import DatabaseSchema, { serializeValue } from '../__generated__';
import tables from '@databases/mysql-typed';
function initDatabase(options: {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}) {
    return createConnectionPool(`mysql://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`,)
}

const { houses, leases, payments, users, rooms } = tables<DatabaseSchema>({
    serializeValue,
});

type Houses = DatabaseSchema['houses']['record'];
type Leases = DatabaseSchema['leases']['record'];
type Rooms = DatabaseSchema['leases']['record'];
type Users = DatabaseSchema['users']['record'];

export { initDatabase, houses, leases, payments, users, rooms, Houses, Leases, Rooms, Users }