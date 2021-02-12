/** This is a test file for testing Braintree Gateway
 * failure. BraintreGateway has been mocked to return
 * success = false.
 */

// npm packages
const request = require('supertest');
const braintree = require('braintree');

// Braintree mock failure.
jest.mock('braintree');
braintree.BraintreeGateway.mockReturnValue({
  transaction: {
    sale: () => ({ success: false, transaction: {} }),
  },
});

// app imports
const app = require('../../app');

const client = request(app);

const {
  TEST_DATA,
  addTestDataHook,
  addPlaceOrderDataHook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../utils/testsConfig');

beforeEach(async function () {
  await addTestDataHook(TEST_DATA);
  addPlaceOrderDataHook(TEST_DATA);
});

afterEach(async function () {
  await clearDBTablesHook();
});

afterAll(async function () {
  await afterAllHook();
  jest.resetAllMocks();
});

describe('POST /orders', function () {
  test('Rejects order with braintree failure', async function () {
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(409);
  });
});
