import { StripeService } from "./stripe";

const initializeStripe = (apiKey: string, stripeAccount: string) => {
  StripeService.initialize(apiKey, stripeAccount);
};

export { initializeStripe };
export {
  type NewStripeCustomer,
  type NewStripeProduct,
  listStripeCustomers,
  createStripeCustomer,
  listStripeProducts,
  createStripeProduct,
} from "./stripe";
