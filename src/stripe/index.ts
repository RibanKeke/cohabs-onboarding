import { StripeService } from "./impl";

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
} from "./impl";
