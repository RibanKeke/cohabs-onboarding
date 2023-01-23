import { faker } from "@faker-js/faker";
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

class StripeService {
  private static instance: StripeService;
  private stripe: Stripe;
  private constructor(apiKey: string, stripeAccount: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2022-11-15",
      stripeAccount,
    });
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
    throw new Error("Stripe is not iniitialized");
  }
}

async function createCustomerPaymentMethod(paymentType: "card") {
  const stripe = StripeService.getStripe();
  const cardNumber = "5555555555554444";
  const creditCardCVV = "123";
  return await stripe.paymentMethods.create({
    type: paymentType,
    card: {
      number: cardNumber,
      cvc: creditCardCVV,
      exp_month: 8,
      exp_year: 2025,
    },
  });
}

async function attachCustomerToPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  const stripe = StripeService.getStripe();
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

async function createStripeCustomer(
  stripeCustomer: NewStripeCustomer
): Promise<Stripe.Customer> {
  const stripe = StripeService.getStripe();
  return await stripe.customers.create(stripeCustomer);
}
async function updateStripeCustomer(
  customerId: string,
  updateParams: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = StripeService.getStripe();
  return await stripe.customers.update(customerId, updateParams);
}

async function listStripeCustomers() {
  return (await StripeService.getStripe().customers.list()).data;
}

async function createStripeProduct(
  newStripeProduct: NewStripeProduct
): Promise<Stripe.Product> {
  const stripe = StripeService.getStripe();
  return await stripe.products.create(newStripeProduct);
}

async function listStripeProducts() {
  return (await StripeService.getStripe().products.list()).data;
}

async function createStripeSubscription(
  NewStripeSubscription: NewStripeSubscription
): Promise<Stripe.Subscription> {
  const stripe = StripeService.getStripe();
  return await stripe.subscriptions.create(NewStripeSubscription);
}

async function listStripeSubscription() {
  return (await StripeService.getStripe().subscriptions.list()).data;
}

export {
  StripeService,
  NewStripeCustomer,
  createStripeCustomer,
  listStripeCustomers,
  createStripeProduct,
  listStripeProducts,
  createStripeSubscription,
  listStripeSubscription,
  createCustomerPaymentMethod,
  attachCustomerToPaymentMethod,
  NewStripeProduct,
  NewStripeSubscription,
  updateStripeCustomer,
};
