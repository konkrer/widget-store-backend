// npm packages
const request = require('supertest');

// local imports
const app = require('../../app');
const Product = require('../../models/product');

// create test client to call API routes
const client = request(app);

const {
  TEST_DATA,
  addTestDataHook,
  addUser2Hook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../utils/testsConfig');

beforeEach(async function () {
  await addTestDataHook(TEST_DATA);
  await addUser2Hook(TEST_DATA);
});

afterEach(async function () {
  await clearDBTablesHook();
});

afterAll(async function () {
  await afterAllHook();
});

describe('GET /products', function () {
  test('Gets a list of all products', async function () {
    const response = await client.get('/products');
    expect(response.body.products).toHaveLength(1);
    expect(response.body.products[0]).toHaveProperty('name');
  });

  test('Search query funtionality works', async function () {
    const posResp = await client.get('/products?query=tee');
    expect(posResp.body.products).toHaveLength(1);
    const negResp = await client.get('/products?query=to');
    expect(negResp.body.products).toHaveLength(0);
  });

  test('Search department funtionality works', async function () {
    const posResp = await client.get('/products?department=All+Departments');
    expect(posResp.body.products).toHaveLength(1);
    const negResp = await client.get('/products?department=Tools');
    expect(negResp.body.products).toHaveLength(0);
  });

  test('Search min_price funtionality works', async function () {
    const posResp = await client.get('/products?min_price=9');
    expect(posResp.body.products).toHaveLength(1);
    const negResp = await client.get('/products?min_price=11');
    expect(negResp.body.products).toHaveLength(0);
  });

  test('Search max_price funtionality works', async function () {
    const posResp = await client.get('/products?max_price=11');
    expect(posResp.body.products).toHaveLength(1);
    const negResp = await client.get('/products?max_price=9');
    expect(negResp.body.products).toHaveLength(0);
  });

  test('Search order_by funtionality works', async function () {
    await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Applesauce',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
    });
    // Applesauce should be first in alphabetical order
    const alphaResp = await client.get(
      '/products?order_by=name&order_by_sort=asc'
    );
    expect(alphaResp.body.products[0].name).toEqual('Applesauce');
    // TeeVee should be first reverse sort
    const reveseResp = await client.get(
      '/products?order_by=name&order_by_sort=desc'
    );
    expect(reveseResp.body.products[0].name).toEqual('TeeVee');
  });

  test('Search newProducts category funtionality works', async () => {
    // get products with discounts
    const resp = await client.get('/products?category=newProducts');
    expect(resp.statusCode).toBe(200);
    expect(resp.body.products.length).toBe(1);
  });

  test('Search deals category funtionality works', async () => {
    // add discount products to database (none yet)
    // add discount product 1
    await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Applesauce',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
      discount: 0.25,
    });
    // add discount product 2
    await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Muffin',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
      discount: 0.5,
    });
    // get products with discounts
    const resp = await client.get('/products?category=deals');
    expect(resp.statusCode).toBe(200);
    expect(resp.body.products.length).toBe(2);
    // expect bigger discount to be first
    expect(resp.body.products[0].name).toBe('Muffin');
    expect(resp.body.products[1].name).toBe('Applesauce');

    // order products by name A-Z
    const resp2 = await client.get(
      '/products?category=deals&order_by=name&order_by_sort=asc'
    );
    expect(resp2.statusCode).toBe(200);
    expect(resp2.body.products.length).toBe(2);
    // expect A to come before M
    expect(resp2.body.products[0].name).toBe('Applesauce');
    expect(resp2.body.products[1].name).toBe('Muffin');

    // order products by name Z-A
    const resp3 = await client.get(
      '/products?category=deals&order_by=name&order_by_sort=desc'
    );
    expect(resp3.statusCode).toBe(200);
    expect(resp3.body.products.length).toBe(2);
    // expect M to come before A
    expect(resp3.body.products[0].name).toBe('Muffin');
    expect(resp3.body.products[1].name).toBe('Applesauce');
  });
});

describe('GET /products/:id', function () {
  test('Gets a single a product', async function () {
    const response = await client.get(
      `/products/${TEST_DATA.testProduct.product_id}`
    );
    expect(response.body.product).toHaveProperty('name');
    expect(response.body.product.name).toBe('TeeVee');
  });

  test('Responds with a 404 if it cannot find the product', async function () {
    const response = await client.get(`/products/0`).send({
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /products', function () {
  test('Creates a new product', async function () {
    const response = await client.post('/products').send({
      name: 'Umbrella',
      description: 'Rain unbrella.',
      price: 123.09,
      _token: TEST_DATA.testUserToken,
      net_weight: 1.2,
      discount: 0.15,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.product).toHaveProperty('name');
    expect(response.body.product.name).toEqual('Umbrella');
    expect(response.body.product).toHaveProperty('date_added');
    expect(typeof response.body.product.date_added).toBe('string');
    debugger;
    expect(response.body.product.discount).toBe('0.15');
  });

  test('Prevents creating a product with duplicate name', async function () {
    const response = await client.post('/products').send({
      name: 'TeeVee',
      description: 'Rain unbrella.',
      price: 123.09,
      net_weight: 1.2,
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(409);
  });

  test('Prevents creating a product with missing name', async function () {
    const response = await client.post('/products').send({
      description: 'Rain unbrella.',
      price: 123.09,
      net_weight: 1.2,
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(400);
  });

  test('Prevents creating a product with missing description', async function () {
    const response = await client.post('/products').send({
      name: 'TeeVee',
      price: 123.09,
      net_weight: 1.2,
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(400);
  });

  test('Prevents creating a product with missing price', async function () {
    const response = await client.post('/products').send({
      name: 'TeeVee',
      description: 'Rain unbrella.',
      net_weight: 1.2,
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(400);
  });

  test('Prevents creating a product with missing net weight', async function () {
    const response = await client.post('/products').send({
      name: 'TeeVee',
      description: 'Rain unbrella.',
      price: 123.09,
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(400);
  });

  test('Fails with non-admin token', async function () {
    const response = await client.post('/products').send({
      name: 'Umbrella',
      description: 'Rain unbrella.',
      price: 123.09,
      _token: TEST_DATA.testUser2Token,
      net_weight: 1.2,
    });
    expect(response.statusCode).toBe(401);
  });

  test('Fails with no token', async function () {
    const response = await client.post('/products').send({
      name: 'Umbrella',
      description: 'Rain unbrella.',
      price: 123.09,
      net_weight: 1.2,
    });
    expect(response.statusCode).toBe(401);
  });
});

describe('PATCH /products/:id', function () {
  test("Updates a single a product's name", async function () {
    const response = await client
      .patch(`/products/${TEST_DATA.testProduct.product_id}`)
      .send({
        name: 'xkcd',
        _token: TEST_DATA.testUserToken,
      });
    expect(response.body.product).toHaveProperty('name');
    expect(response.body.product.name).toBe('xkcd');
  });

  test('Prevents a bad product update', async function () {
    const response = await client
      .patch(`/products/${TEST_DATA.testProduct.product_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
        cactus: false,
      });
    expect(response.statusCode).toBe(400);
  });

  test('Responds with a 404 if it cannot find the product', async function () {
    // delete product first
    await client
      .delete(`/products/${TEST_DATA.testProduct.product_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    const response = await client
      .patch(`/products/${TEST_DATA.testProduct.product_id}`)
      .send({
        name: 'notgonnawork',
        _token: TEST_DATA.testUserToken,
      });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /products/:id', function () {
  test('Deletes a single a product', async function () {
    const response = await client
      .delete(`/products/${TEST_DATA.testProduct.product_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
      });
    expect(response.body).toEqual({ message: 'Product deleted' });
  });

  test('Responds with a 404 if it cannot find the product in question', async function () {
    // delete product first
    const response = await client.delete(`/products/0`).send({
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('getCategoryIDs method', () => {
  test('should return discount ids and id string when category is "deals"', async () => {
    // add discount products to database (none yet)
    // add discount product 1
    const dealResp = await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Applesauce',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
      discount: 0.25,
    });
    // add discount product 2
    const dealResp2 = await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Muffin',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
      discount: 0.5,
    });

    const { ids, escapedIDString } = await Product.getCategoryIDs('deals');

    expect(ids.length).toBe(2);
    expect(ids[0]).toBe(dealResp.body.product.product_id);
    expect(ids[1]).toBe(dealResp2.body.product.product_id);
    expect(escapedIDString).toBe('$1, $2');
  });

  test('should return new ids and id string when category is "newProducts"', async () => {
    // hard to test well as date added is the same for all test products
    // get new products
    const resp = await Product.getCategoryIDs('newProducts');
    expect(resp.ids.length).toBe(1);
    expect(resp.escapedIDString).toBe('$1');

    // add new product
    await client.post('/products').send({
      _token: TEST_DATA.testUserToken,
      name: 'Applesauce',
      description: 'food',
      price: 5.0,
      net_weight: 1.2,
    });

    const resp2 = await Product.getCategoryIDs('newProducts');
    expect(resp2.ids.length).toBe(2);
    expect(resp2.escapedIDString).toBe('$1, $2');
  });

  test('should return empty array and empty string when nothing to find', async () => {
    // no discount products added
    // default category selection is deals when argument omitted.
    const resp = await Product.getCategoryIDs();
    expect(resp.ids.length).toBe(0);
    expect(resp.escapedIDString).toBe('');
  });
});
