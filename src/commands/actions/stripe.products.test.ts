import Stripe from "stripe";
import { Rooms } from "../../database";
import * as StripeImport from "../../stripe";
import * as DatabaseRooms from "../../database";
import { checkStripeProducts } from "./stripe.products";

const stripeTestProduct: Stripe.Product = {
  id: "test-stripe-product-id",
  created: Date.now(),
  description: "",
  active: true,
  attributes: [],
  images: [],
  livemode: true,
  name: "Test product",
  object: "product",
  shippable: false,
  tax_code: null,
  url: null,
  type: "good",
  updated: Date.now(),
  package_dimensions: {
    height: 0,
    length: 0,
    weight: 0,
    width: 0,
  },
  metadata: {},
};

const testCohabRoom: Rooms = {
  active: 1,
  baseRent: 1500,
  category: "classic",
  cmsId: null,
  createdAt: new Date().toISOString(),
  deleted: 0,
  deposit: 1500,
  description: "Room",
  houseId: "test-house-id",
  id: "test-room-id",
  location: "",
  lockId: "lock-id",
  number: null,
  rent: 1500,
  stripeProductId: "test-stripe-product-id",
  surface: 200,
  unitId: null,
  updatedAt: new Date().toISOString(),
};

function getTestStripeProducts(ids: Array<string>) {
  return ids.map((id) => ({ ...stripeTestProduct, id }));
}
const randomId = () => Math.floor(100000 + Math.random() * 900000);

function getTestCohabRooms(
  stripeProductIds: Array<string | null>,
  reset?: Partial<Rooms>
): Array<Rooms> {
  return stripeProductIds.map((id) => ({
    ...testCohabRoom,
    ...(reset ? reset : {}),
    id: String(randomId()),
    stripeProductId: id,
  }));
}

describe("Check cohabsUsers have a stripe account", () => {
  const validIds = ["valid1", "valid2", "valid3"];
  test("Test for out_of_sync:missing rooms", async () => {
    const missingIds = [null, null, null];
    const cohabRooms = [
      ...getTestCohabRooms(missingIds),
      ...getTestCohabRooms(validIds),
    ];
    const stripeProducts: Array<Stripe.Product> = [
      ...getTestStripeProducts(validIds),
    ];

    jest
      .spyOn(StripeImport, "listStripeProducts")
      .mockResolvedValue(stripeProducts);
    jest.spyOn(DatabaseRooms, "listCohabRooms").mockResolvedValue(cohabRooms);

    const { roomsSummary, roomsCount } = await checkStripeProducts();
    expect(Object.keys(roomsSummary.missing as object).length).toEqual(3);
    expect(roomsCount).toEqual(6);
  });
  test("Test for synced rooms", async () => {
    const syncedId = "syncedId";
    const cohabRooms = [...getTestCohabRooms([syncedId])];

    jest.spyOn(StripeImport, "getStripeProduct").mockResolvedValue({
      ...stripeTestProduct,
      id: syncedId,
      lastResponse: {
        headers: {},
        requestId: "",
        statusCode: 1,
      },
    });
    jest.spyOn(DatabaseRooms, "listCohabRooms").mockResolvedValue(cohabRooms);

    const { roomsSummary, roomsCount } = await checkStripeProducts();
    expect((roomsSummary?.synced ?? []).length).toEqual(1);
    expect(roomsCount).toEqual(1);
  });
});
