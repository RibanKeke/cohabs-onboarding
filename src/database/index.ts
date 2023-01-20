import { DatabaseService } from "./database";
import { findUserByStripeCustomerId, updateUser } from "./users";
import * as Entities from './models';

const initializeDatabase = (options: {
    host: string,
    port: number,
    user: string,
    password: string,
    database: string
}
) => DatabaseService.initialize(options)

export {
    Entities,
    initializeDatabase,
    updateUser,
    findUserByStripeCustomerId
}