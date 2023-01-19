import { StripeService, NewStripeCustomer, createStripeCustomer, listStripCustomers } from "./stripe";

const initializeStripe = (apiKey: string, stripeAccount: string) => StripeService.initialize(apiKey, stripeAccount);

export { initializeStripe, NewStripeCustomer, createStripeCustomer, listStripCustomers }