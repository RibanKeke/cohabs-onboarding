
import createConnectionPool, { ConnectionPool } from '@databases/mysql';
import DatabaseSchema, { serializeValue } from '../__generated__';
import tables from '@databases/mysql-typed';

const { houses, leases, payments, users, rooms } = tables<DatabaseSchema>({
    serializeValue,
});

type Houses = DatabaseSchema['houses']['record'];
type Leases = DatabaseSchema['leases']['record'];
type Rooms = DatabaseSchema['leases']['record'];
type Users = DatabaseSchema['users']['record'];



class DatabaseService {
    private static instance: DatabaseService;
    private db: ConnectionPool;
    private constructor(options: {
        host: string,
        port: number,
        user: string,
        password: string,
        database: string
    }) {
        this.db = createConnectionPool(`mysql://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`);
    }

    static initialize(options: {
        host: string,
        port: number,
        user: string,
        password: string,
        database: string
    }) {
        if (!DatabaseService.instance) {
            this.instance = new DatabaseService(options);
        }
        return this.instance.db;
    }

    static getDb() {
        if (this.instance) {
            return this.instance.db;
        }
        throw ('Database is not iniitialized');
    }
}

export { DatabaseService, houses, leases, payments, users, rooms, Houses, Leases, Rooms, Users }