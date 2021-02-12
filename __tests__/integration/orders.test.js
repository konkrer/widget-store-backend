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
  addPlaceOrderDataHook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../utils/testsConfig');

beforeAll(async function () {
  await beforeAllHook();
});

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
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(201);
    expect(response.body.order).toHaveProperty('order_id');
  });

  test('Creates a new guest order with items in stock', async function () {
    delete TEST_DATA.placeOrderData.orderData.customer.user_id;
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(201);
    expect(response.body.order).toHaveProperty('order_id');
  });

  test('Rejects new order with items out of stock', async function () {
    // only 10 in stock
    TEST_DATA.placeOrderData.cart = {
      items: {
        [TEST_DATA.testProduct.product_id]: {
          product_id: TEST_DATA.testProduct.product_id,
          quantity: 11,
          name: 'TeeVee',
          price: '10.00',
          discount: '0.00',
        },
      },
      subtotal: '110.00',
      numCartItems: 11,
    };
    TEST_DATA.placeOrderData.orderData.tax = '9.35';
    TEST_DATA.placeOrderData.orderData.total = '131.35';
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Rejects new order with bad item price data', async function () {
    TEST_DATA.placeOrderData.cart = {
      items: {
        [TEST_DATA.testProduct.product_id]: {
          product_id: TEST_DATA.testProduct.product_id,
          quantity: 1,
          name: 'TeeVee',
          price: '1.00',
          discount: '0.00',
        },
      },
      subtotal: '10.00',
      numCartItems: 1,
    };
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Rejects new order with bad item discount data', async function () {
    TEST_DATA.placeOrderData.cart = {
      items: {
        [TEST_DATA.testProduct.product_id]: {
          product_id: TEST_DATA.testProduct.product_id,
          quantity: 1,
          name: 'TeeVee',
          price: '10.00',
          discount: '0.50',
        },
      },
      subtotal: '10.00',
      numCartItems: 1,
    };
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Rejects new order with bad subtotal data', async function () {
    TEST_DATA.placeOrderData.cart = {
      items: {
        [TEST_DATA.testProduct.product_id]: {
          product_id: TEST_DATA.testProduct.product_id,
          quantity: 1,
          name: 'TeeVee',
          price: '10.00',
          discount: '0.00',
        },
      },
      subtotal: '1.00',
      numCartItems: 1,
    };
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Rejects new order with bad tax data', async function () {
    TEST_DATA.placeOrderData.orderData.tax = '0.00';
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);

    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Rejects new order with bad total data', async function () {
    TEST_DATA.placeOrderData.orderData.total = '1.85';
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Prevents creating a order without a cart field', async function () {
    delete TEST_DATA.placeOrderData.cart;
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(400);
  });

  test('Prevents creating a order without a orderData field', async function () {
    delete TEST_DATA.placeOrderData.orderData;
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
    expect(response.statusCode).toBe(400);
  });

  test('Prevents creating a order without a nonce field', async function () {
    delete TEST_DATA.placeOrderData.nonce;
    const response = await client
      .post(`/orders`)
      .send(TEST_DATA.placeOrderData);
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
