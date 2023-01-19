import Stripe from "stripe";

type NewStripeCustomer = Pick<Stripe.CustomerCreateParams, 'description' | 'email' | 'name' | 'phone'> & {
    metadata: {
        cohabUserId: string
    }
}

class StripeService {
    private static instance: StripeService;
    private stripe: Stripe;
    private constructor(apiKey: string, stripeAccount: string) {
        this.stripe = new Stripe(apiKey, { apiVersion: '2022-11-15', stripeAccount });
    }

    static initialize(apiKey: string, stripeAccount: string) {
        if (!StripeService.instance) {
            this.instance = new StripeService(apiKey, stripeAccount);
        }
    }

    static getStripe() {
        if (this.instance) {
            return this.instance.stripe;
        }
        throw ('Stripe is not iniitialized');
    }
}

async function createStripeCustomer(newStripeUser: NewStripeCustomer): Promise<Stripe.Customer> {
    const stripe = StripeService.getStripe();
    return await stripe.customers.create(newStripeUser);
}

async function listStripCustomers() {
    return (await StripeService.getStripe().customers.list()).data;
}

export { StripeService, NewStripeCustomer, createStripeCustomer, listStripCustomers }