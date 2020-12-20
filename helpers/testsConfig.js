/** Configuration file for intergrations tests. */

// npm packages
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// app imports
const app = require('../app');
const db = require('../db');
const createToken = require('./createToken');
const { BCRYPT_WORK_FACTOR } = require('../config');

// global auth variable to store things for all the tests
const TEST_DATA = {};

async function beforeAllHook() {
  try {
  } catch (error) {
    console.error(error);
  }
}

/**
 * Hooks to insert a user, distributor, product, and order, and to authenticate
 *  the user for respective tokens that are stored
 *  in the input `testData` parameter.
 * @param {Object} TEST_DATA - build the TEST_DATA object
 */
async function beforeEachHook(TEST_DATA) {
  try {
    // login a user, make a token, store the user and token
    const hashedPassword = await bcrypt.hash('secret', BCRYPT_WORK_FACTOR);
    const testUserRes = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name,
        address, apt_number, state, postal_code, phone_number, avatar_url,
        email_validated, is_admin)
      VALUES ('testuser', 'abc@cde.com', $1, 'Testy', 'McTest',
        '123 Main St', '5', 'CA', 99999, '555.555.5555', 'http://site.com/image.jpg',
        true, true)
      RETURNING *`,
      [hashedPassword]
    );
    // const response = await request(app).post('/login').send({
    //   username: 'testuser',
    //   password: 'secret',
    // });
    TEST_DATA.testUser = testUserRes.rows[0];
    TEST_DATA.testUserToken = createToken({
      username: 'testuser',
      user_id: TEST_DATA.testUser.user_id,
      is_admin: true,
    });

    //create test distributor in DB and save in TEST_DATA
    const distRes = await db.query(
      `INSERT INTO distributors (name) VALUES ('DistCo') RETURNING *`
    );
    TEST_DATA.testDistributor = distRes.rows[0];

    // create test product in DB and save in TEST_DATA
    const newProductRes = await db.query(
      `INSERT INTO products (name, description, price, distributor, quantity)
      VALUES ('TeeVee', 'Boob Tube', 10.00,  $1, 2)
      RETURNING *`,
      [TEST_DATA.testDistributor.distributor_id]
    );
    TEST_DATA.testProduct = newProductRes.rows[0];

    // create test order in DB and save in TEST_DATA
    const newOrder = await db.query(
      `INSERT INTO orders (customer, distinct_cart_items, total_items_quantity,
        subtotal, tax, shipping_cost, total, shipping_method)
      VALUES ($1, 1, 1, 10.00, 1.00, 1.00, 12.00, 'ups')
      RETURNING *`,
      [TEST_DATA.testUser.user_id]
    );
    TEST_DATA.testOrder = newOrder.rows[0];

    // Add product to test order.
    await db.query(
      `INSERT INTO orders_products
      VALUES ($1, $2, 1)`,
      [TEST_DATA.testOrder.order_id, TEST_DATA.testProduct.product_id]
    );
  } catch (error) {
    console.error(error);
  }
}

async function afterEachHook() {
  try {
    await db.query('DELETE FROM orders_products');
    await db.query('DELETE FROM orders');
    await db.query('DELETE FROM products');
    await db.query('DELETE FROM distributors');
    await db.query('DELETE FROM users');
  } catch (error) {
    console.error(error);
  }
}

async function afterAllHook() {
  try {
    await db.end();
  } catch (err) {
    console.error(err, 'end error');
  }
}

module.exports = {
  afterAllHook,
  afterEachHook,
  TEST_DATA,
  beforeAllHook,
  beforeEachHook,
};
