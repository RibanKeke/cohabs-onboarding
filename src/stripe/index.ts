import { StripeService, NewStripeCustomer, createStripeCustomer } from "./stripe";

const initializeStripe = (apiKey: string, stripeAccount: string) => StripeService.initialize(apiKey, stripeAccount);
const getStripe = StripeService.getStripe

export { initializeStripe, NewStripeCustomer, getStripe, createStripeCustomer }