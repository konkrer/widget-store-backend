// npm packages
const request = require('supertest');

// app imports
const app = require('../../app');

const client = request(app);

const {
  TEST_DATA,
  beforeAllHook,
  beforeEachHook,
  afterEachHook,
  afterAllHook,
} = require('../../helpers/testsConfig');

beforeAll(async function () {
  await beforeAllHook();
});

beforeEach(async function () {
  await beforeEachHook(TEST_DATA);
});

afterEach(async function () {
  await afterEachHook();
});

afterAll(async function () {
  await afterAllHook();
});

describe('GET /orders', function () {
  test('Gets a list of all (1) orders', async function () {
    const response = await client
      .get(`/orders`)
      .send({ _token: TEST_DATA.testUserToken });
    const orders = response.body.orders;
    expect(orders).toHaveLength(1);
    expect(orders[0]).toHaveProperty('order_id');
    expect(orders[0]).toHaveProperty('status');
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
      _token: TEST_DATA.testUserToken,
      customer: TEST_DATA.testUser.user_id,
      distinct_cart_items: 1,
      total_items_quantity: 2,
      subtotal: 20.0,
      tax: 2.0,
      shipping_cost: 2.0,
      total: 24.0,
      shipping_method: 'usps',
      items: [[TEST_DATA.testProduct.product_id, 2]],
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.order).toHaveProperty('order_id');
    expect(response.body.order).toHaveProperty('items');
    expect(response.body.order.items).toHaveLength(1);
    expect(response.body.order.items[0].quantity).toBe(2);
  });

  test('Rejects new order with items out of stock', async function () {
    const response = await client.post(`/orders`).send({
      _token: TEST_DATA.testUserToken,
      customer: TEST_DATA.testUser.user_id,
      distinct_cart_items: 1,
      total_items_quantity: 3,
      subtotal: 30.0,
      tax: 2.0,
      shipping_cost: 2.0,
      total: 34.0,
      shipping_method: 'usps',
      items: [[TEST_DATA.testProduct.product_id, 3]],
    });
    expect(response.statusCode).toBe(409);
    expect(response.body).toHaveProperty('error');
  });

  test('Resets all product quantities to original when order fails', async function () {
    // create product to be decremented first by Product.decrementOrderProducts().
    const newProdRes = await client.post('/products').send({
      name: 'Umbrella',
      description: 'Rain unbrella.',
      price: 123.09,
      quantity: 10,
      _token: TEST_DATA.testUserToken,
    });
    const umbrellaId = newProdRes.body.product.product_id;
    // place order that will fail (insufficient quantity for second item)
    const response = await client.post(`/orders`).send({
      _token: TEST_DATA.testUserToken,
      customer: TEST_DATA.testUser.user_id,
      distinct_cart_items: 1,
      total_items_quantity: 3,
      subtotal: 30.0,
      tax: 2.0,
      shipping_cost: 2.0,
      total: 34.0,
      shipping_method: 'usps',
      items: [[umbrellaId, 3], [(TEST_DATA.testProduct.product_id, 3)]],
    });
    expect(response.statusCode).toBe(409);
    // make sure quantity of umbrella is set back to original 10.
    const umbrellaRes2 = await client.get(`/products/${umbrellaId}`);
    expect(umbrellaRes2.body.product).toHaveProperty('quantity');
    expect(umbrellaRes2.body.product.quantity).toBe(10);
  });

  test('Prevents creating a order without a required field', async function () {
    const response = await client.post(`/orders`).send({
      _token: TEST_DATA.testUserToken,
      customer: TEST_DATA.testUser.user_id,
      distinct_cart_items: 1,
      total_items_quantity: 2,
      subtotal: 20.0,
      tax: 2.0,
      shipping_cost: 2.0,
      total: 24.0,
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
