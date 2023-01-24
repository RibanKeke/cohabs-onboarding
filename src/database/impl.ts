import createConnectionPool, { ConnectionPool } from "@databases/mysql";

class DatabaseService {
  private static instance: DatabaseService;
  private db: ConnectionPool;
  private constructor(options: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.db = createConnectionPool(
      `mysql://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`
    );
  }

  /**
   * Initialize the database connection pool
   * @param options {    host: string; port: number; user: string; password: string; database: string;}
   * @returns ConnectionPool (@database/mysql)
   */
  static initialize(options: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    if (!DatabaseService.instance) {
      this.instance = new DatabaseService(options);
    }
    return this.instance.db;
  }

  /**
   * Get an initialized database connection pool
   * @returns ConnectionPool
   * @throws "Database is not initialized" if it's called before initializing the database
   */
  static getDb() {
    if (this.instance) {
      return this.instance.db;
    }
    throw new Error("Database is not iniitialized");
  }
}

export { DatabaseService };
