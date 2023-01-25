import { StripeService } from "./impl";

/**
 * Initialize Stripe API
 * @param apiKey Stripe api key linked to the account
 * @param stripeAccount Stripe owner account
 */
const initializeStripe = (apiKey: string, stripeAccount: string) => {
  StripeService.initialize(apiKey, stripeAccount);
};

export { initializeStripe };
export {
  type NewStripeCustomer,
  type NewStripeProduct,
  type NewStripeSubscription,
  listStripeCustomers,
  createStripeCustomer,
  listStripeProducts,
  createStripeProduct,
  createStripeSubscription,
  listStripeSubscription,
  attachCustomerToPaymentMethod,
  updateStripeCustomer,
  createCustomerPaymentMethod,
  getStripeCustomer,
  getStripeProduct,
  getStripeSubscription,
} from "./impl";
