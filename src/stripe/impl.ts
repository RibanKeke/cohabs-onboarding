import Stripe from "stripe";
import {
  NewStripeCustomer,
  NewStripeProduct,
  NewStripeSubscription,
} from "./interface";

class StripeService {
  private static instance: StripeService;
  private stripe: Stripe;
  private constructor(apiKey: string, stripeAccount: string) {
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2022-11-15",
      stripeAccount,
    });
  }

  /**
   * Initialize Stripe API
   * @param apiKey Stripe api key linked to the account
   * @param stripeAccount Stripe owner account
   */
  static initialize(apiKey: string, stripeAccount: string) {
    if (!StripeService.instance) {
      this.instance = new StripeService(apiKey, stripeAccount);
    }
  }

  /**
   * Get an initialized instance of the Stripe API
   * @returns Stripe instance
   * @throws "Stripe is not initialized" if called before initializing Stripe api with credentials
   */
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
  return await stripe.paymentMethods
    .create({
      type: paymentType,
      card: {
        number: cardNumber,
        cvc: creditCardCVV,
        exp_month: 8,
        exp_year: 2025,
      },
    })
    .then((StripeResponse) => {
      return StripeResponse as Stripe.PaymentMethod;
    });
}

async function attachCustomerToPaymentMethod(
  paymentMethodId: string,
  customerId: string
) {
  const stripe = StripeService.getStripe();
  await stripe.paymentMethods.attach(paymentMethodId, {
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
  return (await StripeService.getStripe().customers.list({ limit: 100 })).data;
}

async function getStripeCustomer(stripeCustomerId: string) {
  const stripe = StripeService.getStripe();
  const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);
  return stripeCustomer;
}

async function getStripeProduct(stripeProductId: string) {
  const stripe = StripeService.getStripe();
  const stripeCustomer = await stripe.products.retrieve(stripeProductId);
  return stripeCustomer;
}

async function createStripeProduct(
  newStripeProduct: NewStripeProduct
): Promise<Stripe.Product> {
  const stripe = StripeService.getStripe();
  return await stripe.products.create(newStripeProduct);
}

async function listStripeProducts() {
  return (await StripeService.getStripe().products.list({ limit: 100 })).data;
}

async function createStripeSubscription(
  NewStripeSubscription: NewStripeSubscription
): Promise<Stripe.Subscription> {
  const stripe = StripeService.getStripe();
  return await stripe.subscriptions.create(NewStripeSubscription);
}

async function listStripeSubscription() {
  return (await StripeService.getStripe().subscriptions.list({ limit: 100 }))
    .data;
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
  getStripeCustomer,
  NewStripeProduct,
  NewStripeSubscription,
  updateStripeCustomer,
  getStripeProduct,
};
