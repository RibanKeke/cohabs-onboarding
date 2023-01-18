
import Stripe from "stripe";
import { findUserByStripeCustomerId, updateUser, Users } from "../../database";
import { UpdateResult, UserExecutionRecord, UsersSummary } from "../../interfaces/commands.interface";
import { NewStripeCustomer, createStripeCustomer } from "../../stripe";

/**
 * Check if cohab tenant has linked stripe customer
 * @param cohabsUsers Existing cohabs users
 * @param stripeCustomers Existing stripe customers
 * @returns 
 */
async function checkStripeUsers(cohabsUsers: Array<Users>, stripeCustomers: Array<Stripe.Customer>): Promise<UsersSummary> {
    const customersIds = stripeCustomers.map(c => c.id);
    const usersSummary = cohabsUsers.reduce((result, cohabUser) => {
        const { missing, invalid }: { missing: boolean, invalid: boolean } = cohabUser.stripeCustomerId === null ? { missing: true, invalid: false } :
            customersIds.includes(cohabUser.stripeCustomerId) ? { missing: false, invalid: false } : { missing: false, invalid: true }

        if (missing) {
            const userExecutionRecord: UserExecutionRecord = { message: '', status: 'new', user: cohabUser };
            return { ...result, missing: { ...result.missing, [cohabUser.id]: userExecutionRecord } }
        }

        if (invalid) {
            const userExecutionRecord: UserExecutionRecord = { message: '', status: 'new', user: cohabUser };
            return { ...result, invalid: { ...result.invalid, [cohabUser.id]: userExecutionRecord } }
        }
        return result;
    }, { missing: {}, invalid: {} } as UsersSummary)
    return usersSummary;
}

/**
 * Create new stripe use and update cohabUser with new stripeCustomerId
 * @param cohabUser Cohab user
 * @param db Database connection pool
 * @param stripe Stripe instance
 * @param commit Flag for commit 
 * @returns UpdateResult<Users>
 */
async function syncStripeUser(cohabUser: Users, commit: boolean): Promise<UpdateResult<Users>> {
    const stripeUser: NewStripeCustomer = {
        description: cohabUser.about ?? 'New cohab stripe user',
        email: cohabUser.email,
        name: `${cohabUser.firstName} ${cohabUser.lastName}`,
        phone: cohabUser.phoneNumber ?? '',
        metadata: {
            cohabUserId: cohabUser.id
        }
    }
    const execute = async () => {
        const newStripeUser = await createStripeCustomer(stripeUser);
        await updateUser(cohabUser.id, { stripeCustomerId: newStripeUser.id });
        return await findUserByStripeCustomerId(newStripeUser.id)
    }
    if (commit) {
        return await execute().then(updatedUser => {
            const successResult: UpdateResult<Users> = { id: updatedUser?.id, status: 'done', target: updatedUser ?? undefined };
            return successResult;
        }
        ).catch(err => {
            const failedResult: UpdateResult<Users> = { id: cohabUser?.id, status: 'failed', target: cohabUser, message: err.message };
            return failedResult;
        })
    } else {
        const simResult: UpdateResult<Users> = {
            id: cohabUser?.id, status: 'skipped', target: cohabUser
        }
        return simResult
    }
}

export { checkStripeUsers, syncStripeUser }