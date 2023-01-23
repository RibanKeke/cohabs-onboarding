import Stripe from "stripe";
import { Users } from "../../database";
import * as DatabaseUsers from "../../database/users";
import * as StripeService from "../../stripe";
import { checkStripeUsers, syncStripeUser } from "./stripe.users";

const testStripeCustomer: Stripe.Customer = {
  id: "test",
  balance: 100,
  created: Date.now(),
  default_source: null,
  description: "",
  object: "customer",
  email: "test@email.com",
  invoice_settings: {
    custom_fields: [],
    default_payment_method: null,
    footer: null,
    rendering_options: null,
  },
  livemode: true,
  metadata: {},
  shipping: null,
};

const testCohabUser: Users = {
  about: null,
  active: 1,
  address: "Boulevard de la decouverte",
  alreadyConnected: 0,
  autoRefundDeposit: 0,
  banned: 1,
  bio: null,
  birthdate: null,
  birthdateVisibility: 0,
  confirmed: 1,
  createdAt: new Date().toISOString(),
  email: "test@email.com",
  emailVisibility: 1,
  employment: "employed",
  facebook: null,
  firstName: null,
  gender: "male",
  genderVisibility: 0,
  id: "xxxxx",
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
  role: "user",
  salt: null,
  serviceVouchers: 0,
  stripeCustomerId: null,
  twitter: null,
  updatedAt: new Date().toISOString(),
  zendeskId: null,
};

const paymentMethodData: Stripe.PaymentMethod = {
  id: "pm_1EUp7k2PIFT5gUVR9xbBlxdD",
  object: "payment_method",
  billing_details: {
    address: {
      city: null,
      country: null,
      line1: null,
      line2: null,
      postal_code: null,
      state: null,
    },
    email: null,
    name: null,
    phone: null,
  },
  card: {
    brand: "visa",
    checks: {
      address_line1_check: null,
      address_postal_code_check: null,
      cvc_check: null,
    },
    country: "US",
    exp_month: 8,
    exp_year: 2020,
    fingerprint: "qIwF9JDw9v5gtnkL",
    funding: "credit",
    last4: "4242",
    networks: {
      available: ["visa"],
      preferred: null,
    },
    three_d_secure_usage: {
      supported: true,
    },
    wallet: null,
  },
  created: 1556604448,

  customer: null,
  livemode: false,
  metadata: {},
  type: "card",
};

function getTestStripeCustomers(ids: Array<string>) {
  return ids.map((id) => ({ ...testStripeCustomer, id }));
}
const randomId = () => Math.floor(100000 + Math.random() * 900000);

function getTestCohabUsers(stripeCustomerIds: Array<string | null>) {
  return stripeCustomerIds.map((id) => ({
    ...testCohabUser,
    id: String(randomId()),
    stripeCustomerId: id,
  }));
}

describe("Check cohabsUsers have a stripe account", () => {
  const validIds = ["valid1", "valid2", "valid3"];
  const missingIds = [null, null];
  const invalidIds = ["invalid1"];
  test("Test for missing and invalid stripeUsers", async () => {
    const cohabUsers = [
      ...getTestCohabUsers(validIds),
      ...getTestCohabUsers(missingIds),
      ...getTestCohabUsers(invalidIds),
    ];
    const stripeCustomers = [...getTestStripeCustomers(validIds)];

    jest
      .spyOn(StripeService, "listStripeCustomers")
      .mockResolvedValue(stripeCustomers);
    jest.spyOn(DatabaseUsers, "listCohabUsers").mockResolvedValue(cohabUsers);

    const { usersSummary } = await checkStripeUsers();
    expect(Object.keys(usersSummary.invalid as object).length).toEqual(1);
    expect(
      Object.values(usersSummary.invalid as object)
        .map((v) => v.item.stripeCustomerId)
        .includes(invalidIds[0])
    );
    expect(Object.keys(usersSummary.missing as object).length).toEqual(2);
    expect(usersSummary.broken).toEqual([]);
    expect(usersSummary.synced).toEqual([]);
  });
});

describe("Update stripe user", () => {
  test("Test update process for a missing or invalid stripe user", async () => {
    jest
      .spyOn(StripeService, "createStripeCustomer")
      .mockResolvedValue({ ...testStripeCustomer, id: "new_stripe_customer" });
    jest
      .spyOn(StripeService, "attachCustomerToPaymentMethod")
      .mockResolvedValue();
    jest
      .spyOn(StripeService, "updateStripeCustomer")
      .mockResolvedValue({ ...testStripeCustomer, id: "new_stripe_customer" });
    jest
      .spyOn(StripeService, "createCustomerPaymentMethod")
      .mockResolvedValue({ ...paymentMethodData });
    jest.spyOn(DatabaseUsers, "updateUser").mockResolvedValue();
    jest.spyOn(DatabaseUsers, "findUserByStripeCustomerId").mockResolvedValue({
      ...testCohabUser,
      stripeCustomerId: "new_stripe_customer",
    });
    const cohabUser = getTestCohabUsers([null])[0];
    const result = await syncStripeUser(cohabUser, true);
    expect(result.status).toEqual("done");
  });
});
