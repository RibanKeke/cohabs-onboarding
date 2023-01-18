import Stripe from "stripe";
import { Users } from "../../database";
import * as DatabaseUsers from "../../database/users";
import * as StripeService from "../../stripe";
import { checkStripeUsers, syncStripeUser } from "./stripe.actions";

const testStripeCustomer: Stripe.Customer = {
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

const testCohabUser: Users = {
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
    return ids.map((id) => ({ ...testStripeCustomer, id }))
}
const randomId = () => Math.floor(100000 + Math.random() * 900000);

function getTestCohabUsers(stripeCustomerIds: Array<string | null>) {
    return stripeCustomerIds.map(id => ({
        ...testCohabUser, id: String(randomId()), stripeCustomerId: id
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
        expect(Object.keys(usersSummary.invalid).length).toEqual(1);
        expect(Object.values(usersSummary.invalid).map(v => v.user.stripeCustomerId).includes(invalidIds[0]));
        expect(Object.keys(usersSummary.missing).length).toEqual(2);
    })
})

describe('Update stripe user', () => {
    test('Test update process for a missing or invalid stripe user', async () => {
        jest.spyOn(StripeService, 'createStripeCustomer').mockResolvedValue({ ...testStripeCustomer, id: 'new_stripe_customer' })
        jest.spyOn(DatabaseUsers, 'updateUser').mockResolvedValue();
        jest.spyOn(DatabaseUsers, 'findUserByStripeCustomerId').mockResolvedValue({
            ...testCohabUser, stripeCustomerId: 'new_stripe_customer'
        });
        const cohabUser = getTestCohabUsers([null])[0];
        const result = await syncStripeUser(cohabUser, true);
        expect(result.status).toEqual('done');
    })

    test('Test update process for a missing or invalid stripe user', async () => {
        jest.spyOn(StripeService, 'createStripeCustomer').mockResolvedValue({ ...testStripeCustomer, id: 'new_stripe_customer' })
        jest.spyOn(DatabaseUsers, 'updateUser').mockRejectedValue(new Error('Test error in sync stripe'))
        jest.spyOn(DatabaseUsers, 'findUserByStripeCustomerId').mockResolvedValue({
            ...testCohabUser, stripeCustomerId: 'new_stripe_customer'
        });
        const cohabUser = getTestCohabUsers([null])[0];
        const result = await syncStripeUser(cohabUser, true);
        expect(result.status).toEqual('failed');
        expect(result.message).toEqual('Test error in sync stripe');
    })
}) 