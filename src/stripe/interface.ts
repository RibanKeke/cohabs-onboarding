import Stripe from "stripe";

type NewStripeCustomer = Pick<
  Stripe.CustomerCreateParams,
  "description" | "email" | "name" | "phone"
> & {
  metadata: {
    cohabUserId: string;
  };
};

type NewStripeProduct = Pick<
  Stripe.ProductCreateParams,
  "active" | "default_price_data" | "description" | "name"
> & {
  metadata: {
    cohabRoomId: string;
  };
};

type NewStripeSubscription = Pick<
  Stripe.SubscriptionCreateParams,
  "customer" | "items"
> & {
  metadata: {
    cohabLeaseId: string;
  };
};

export { NewStripeSubscription, NewStripeCustomer, NewStripeProduct };
