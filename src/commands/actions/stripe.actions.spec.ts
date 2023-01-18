import createConnectionPool from "@databases/mysql";
import Stripe from "stripe";
import { initDatabase, Users } from "../../database/database";
import { checkStripeUsers, syncStripeUser } from "./stripe.actions";


jest.doMock('stripe', () => {
    return jest.fn(() => ({
        customers: {
            create: jest.fn(() => Promise.resolve({
                id: 'new_stripe_user',
                name: "Jest_User",
                currency: "sgd",
                description: "Jest User Account created",
            })),
        },
    }));
});


const defaultStripeCustomer: Stripe.Customer = {
    id: 'test',
    balance: 100,
    created: Date.now(),
    default_source: null,
    description: '',
    object: 'customer',
    email: 'test@email.com',
    invoice_settings: {
        custom_fields: [],
        default_payment_method: null,
        footer: null,
        rendering_options: null,
    },
    livemode: true,
    metadata: {},
    shipping: null
}

const defaultCohabUser: Users = {
    about: null,
    active: 1,
    address: 'Boulevard de la decouverte',
    alreadyConnected: 0,
    autoRefundDeposit: 0,
    banned: 1,
    bio: null,
    birthdate: null,
    birthdateVisibility: 0,
    confirmed: 1,
    createdAt: new Date().toISOString(),
    email: 'test@email.com',
    emailVisibility: 1,
    employment: 'employed',
    facebook: null,
    firstName: null,
    gender: 'male',
    genderVisibility: 0,
    id: 'xxxxx',
    instagram: null,
    interests: null,
    job: null,
    lastName: null,
    linkedIn: null,
    nationalityId: null,
    nickName: null,
    password: null,
    phoneNumber: null,
    phoneNumberVisibility: 1,
    picture: null,
    prefixId: null,
    residency: null,
    role: 'user',
    salt: null,
    serviceVouchers: 0,
    stripeCustomerId: null,
    twitter: null,
    updatedAt: new Date().toISOString(),
    zendeskId: null
}

function getTestStripeCustomers(ids: Array<string>) {
    return ids.map((id) => ({ ...defaultStripeCustomer, id }))
}
const randomId = () => Math.floor(100000 + Math.random() * 900000);

function getTestCohabUsers(stripeCustomerIds: Array<string | null>) {
    return stripeCustomerIds.map(id => ({
        ...defaultCohabUser, id: String(randomId()), stripeCustomerId: id
    }))
}

describe('Stripe Users', () => {
    const validIds = ['valid1', 'valid2', 'valid3'];
    const missingIds = [null, null];
    const invalidIds = ['invalid1']
    test('Test for missing and invalid stripeUsers', async () => {
        const cohabUsers = [...getTestCohabUsers(validIds), ...getTestCohabUsers(missingIds), ...getTestCohabUsers(invalidIds)];
        const stripeCustomers = [...getTestStripeCustomers(validIds)];
        const usersSummary = await checkStripeUsers(cohabUsers, stripeCustomers);
        //Check the right count of invalid ids
        expect(Object.keys(usersSummary.invalid).length).toEqual(1);

        //Check if the invalidId is included in the invalid count
        expect(Object.values(usersSummary.invalid).map(v => v.user.stripeCustomerId).includes(invalidIds[0]));

        //Check we have the right count of missing ids
        expect(Object.keys(usersSummary.missing).length).toEqual(2);
    })
})

describe('Update stripe user', () => {
    jest.setMock('../../database/database.ts', { initDatabase });

    jest.mock('../../database/users.ts', () => {
        const originalModule = jest.requireActual('../../database/users.ts');
        return {
            ...originalModule,
            updateUser: jest.fn(() => Promise.resolve()),
            findUserByStripeCustomerId: jest.fn(() => Promise.resolve())
        };
    });
    const db = initDatabase({
        host: "localhost",
        port: 3306,
        user: "root",
        password: "",
        database: "test"
    });
    const stripe = new Stripe('', { apiVersion: '2022-11-15' });
    test('Test update process for a missing or invalid stripe user', async () => {
        const cohabUser = getTestCohabUsers([null])[0];
        const result = await syncStripeUser(cohabUser, db, stripe, true);
        console.log(result)
    })
}) 