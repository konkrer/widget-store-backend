// npm packages
const request = require('supertest');
const braintree = require('braintree');

jest.mock('braintree');
braintree.BraintreeGateway.mockReturnValue({
  transaction: {
    sale: () => ({ success: true, transaction: {} }),
  },
});

// app imports
const app = require('../../app');

const client = request(app);

const {
  TEST_DATA,
  beforeAllHook,
  addTestDataHook,
  addUser2Hook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../helpers/testsConfig');

beforeAll(async function () {
  await beforeAllHook();
});

beforeEach(async function () {
  await addTestDataHook(TEST_DATA);
});

afterEach(async function () {
  await clearDBTablesHook();
});

afterAll(async function () {
  await afterAllHook();
  jest.resetAllMocks();
});

describe('GET /orders', function () {
  test('Gets a list of all orders with admin token', async function () {
    const response = await client
      .get(`/orders`)
      .send({ _token: TEST_DATA.testUserToken });
    const orders = response.body.orders;
    expect(orders).toHaveLength(1);
    expect(orders[0]).toHaveProperty('order_id');
    expect(orders[0]).toHaveProperty('status');
  });

  test('Fails with 401 with non-admin token', async function () {
    addUser2Hook(TEST_DATA);
    const response = await client
      .get(`/orders`)
      .send({ _token: TEST_DATA.testUser2Token });
    expect(response.statusCode).toBe(401);
  });
});

describe('GET /orders/:id', function () {
  test('Gets a single a order and with items array', async function () {
    const response = await client
      .get(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    const order = response.body.order;
    expect(order).toHaveProperty('total');
    expect(order).toHaveProperty('items');
    expect(order.items).toHaveLength(1);
  });

  test('Fails with 401 if no user or wrong user', async function () {
    // no user
    const response = await client
      .get(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: null });
    expect(response.statusCode).toBe(401);
    // wrong user
    addUser2Hook(TEST_DATA);
    const response2 = await client
      .get(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: TEST_DATA.testUser2Token });
    expect(response2.statusCode).toBe(401);
  });

  test('Responds with a 404 if it cannot find the order in question', async function () {
    const response = await client
      .get(`/orders/0`)
      .send({ _token: TEST_DATA.testUserToken });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /orders', function () {
  test('Creates a new order with items in stock', async function () {
    const response = await client.post(`/orders`).send({
      cart: {
        items: {
          [TEST_DATA.testProduct.product_id]: {
            product_id: TEST_DATA.testProduct.product_id,
            quantity: 1,
            name: 'TeeVee',
          },
        },
        subtotal: '10.00',
        numCartItems: 1,
      },
      orderData: {
        shipping: { details: { cost: '12.00' } },
        tax: '0.85',
        total: '22.85',
        customer: {
          first_name: 'Test',
          last_name: 'User',
          email: 'foo@gmail.com',
          address: '1234 Main St',
          address_line2: '',
          city: 'Big City',
          state: 'CA',
          postal_code: '20394-3928',
          phone_number: '(415) 556.5553',
          user_id: TEST_DATA.testUser.user_id,
        },
      },
      nonce: 'tokencc_bf_xnddbn_wm4wrz_pg86zf_kgybs3_jw6',
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.order).toHaveProperty('order_id');
  });

  test('Rejects new order with items out of stock', async function () {
    const response = await client.post(`/orders`).send({
      cart: {
        items: {
          [TEST_DATA.testProduct.product_id]: {
            product_id: TEST_DATA.testProduct.product_id,
            quantity: 11,
            name: 'TeeVee',
          },
        },
        subtotal: '10.00',
        numCartItems: 11,
      },
      orderData: {
        shipping: { details: { cost: '12.00' } },
        tax: '0.85',
        total: '22.85',
        customer: {
          first_name: 'Test',
          last_name: 'User',
          email: 'foo@gmail.com',
          address: '1234 Main St',
          address_line2: '',
          city: 'Big City',
          state: 'CA',
          postal_code: '20394-3928',
          phone_number: '(415) 556.5553',
          user_id: TEST_DATA.testUser.user_id,
        },
      },
      nonce: 'tokencc_bf_xnddbn_wm4wrz_pg86zf_kgybs3_jw6',
    });
    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Prevents creating a order without a required field', async function () {
    const response = await client.post(`/orders`).send({
      orderData: {
        shipping: { details: { cost: '12.00' } },
        tax: '0.85',
        total: '22.85',
        customer: {
          first_name: 'Test',
          last_name: 'User',
          email: 'foo@gmail.com',
          address: '1234 Main St',
          address_line2: '',
          city: 'Big City',
          state: 'CA',
          postal_code: '20394-3928',
          phone_number: '(415) 556.5553',
          user_id: TEST_DATA.testUser.user_id,
        },
      },
      nonce: 'tokencc_bf_xnddbn_wm4wrz_pg86zf_kgybs3_jw6',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('PATCH /orders/:id', function () {
  test("Updates a single a order's status", async function () {
    const response = await client
      .patch(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ status: 'Shipped', _token: TEST_DATA.testUserToken });
    expect(response.body.order).toHaveProperty('status');
    expect(response.body.order.status).toBe('Shipped');
    expect(response.body.order.order_id).toBe(TEST_DATA.testOrder.order_id);
  });

  test('Prevents update of any property except status', async function () {
    const response = await client
      .patch(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
        total: 0.5,
      });
    expect(response.statusCode).toBe(400);
  });

  test('Prevents a bad order update', async function () {
    const response = await client
      .patch(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
        cactus: false,
      });
    expect(response.statusCode).toBe(400);
  });

  test('Responds with a 404 if it cannot find the order in question', async function () {
    // delete order first
    await client.delete(`/orders/${TEST_DATA.testOrder.order_id}`).send({
      _token: TEST_DATA.testUserToken,
    });
    const response = await client
      .patch(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
        status: 'Shipped',
      });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /orders/:id', function () {
  test('Deletes a single a order', async function () {
    const response = await client
      .delete(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    expect(response.body).toEqual({ message: 'Order deleted' });
  });

  test('Responds with a 404 if it cannot find the order in question', async function () {
    // delete order first
    await client
      .delete(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    const response = await client
      .delete(`/orders/${TEST_DATA.testOrder.order_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    expect(response.statusCode).toBe(404);
  });
});
