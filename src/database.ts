
import createConnectionPool from '@databases/mysql';
import DatabaseSchema, { serializeValue } from './__generated__';
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
const { houses, leases, payments } = tables<DatabaseSchema>({
    serializeValue,
});

export { initDatabase, houses, leases, payments, }