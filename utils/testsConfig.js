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
 * Hook to insert a user, distributor, product, and order, and to authenticate
 *  the user for respective tokens that are stored
 *  in the input `testData` parameter.
 *
 * @param {Object} TEST_DATA - build the TEST_DATA object
 */

async function addTestDataHook(TEST_DATA) {
  try {
    // login a user, make a token, store the user and token
    const hashedPassword = await bcrypt.hash('Password1', BCRYPT_WORK_FACTOR);
    const testUserRes = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name,
        address, address_line2, state, postal_code, phone_number, avatar_url,
        email_validated, is_admin)
      VALUES ('testuser', 'testuser@gmail.com', $1, 'Testy', 'McTest',
        '123 Main St', '5', 'CA', 99999, '555.555.5555', 'http://site.com/image.jpg',
        true, true)
      RETURNING *`,
      [hashedPassword]
    );

    TEST_DATA.testUser = testUserRes.rows[0];
    TEST_DATA.testUserToken = createToken({
      username: 'testuser',
      user_id: TEST_DATA.testUser.user_id,
      is_admin: true,
    });
    TEST_DATA.password = 'Password1';

    //create test distributor in DB and save in TEST_DATA
    const distRes = await db.query(
      `INSERT INTO distributors (name) VALUES ('DistCo') RETURNING *`
    );
    TEST_DATA.testDistributor = distRes.rows[0];

    //create test distributor 2 in DB and save in TEST_DATA
    const distRes2 = await db.query(
      `INSERT INTO distributors (name, logo_url) 
      VALUES ('DistInc', 'example@example.com') RETURNING *`
    );
    TEST_DATA.testDistributor2 = distRes2.rows[0];

    // create test product in DB and save in TEST_DATA
    const newProductRes = await db.query(
      `INSERT INTO products (name, description, price, distributor, quantity, net_weight)
      VALUES ('TeeVee', 'Boob Tube', 10.00,  $1, 10, 1.3)
      RETURNING *`,
      [TEST_DATA.testDistributor.distributor_id]
    );
    TEST_DATA.testProduct = newProductRes.rows[0];

    // create test order in DB and save in TEST_DATA
    const newOrder = await db.query(
      `INSERT INTO orders (customer, customer_info, total_items_quantity,
        subtotal, tax, shipping_cost, total, shipping_method, processor_transaction)
      VALUES ($1, '{}', 1, 10.00, 1.00, 1.00, 12.00, '{}', '{}')
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

async function addUser2Hook(TEST_DATA) {
  try {
    // login a user, make a token, store the user and token
    const hashedPassword = await bcrypt.hash('Password1', BCRYPT_WORK_FACTOR);
    const testUser2Res = await db.query(
      `INSERT INTO users (username, email, password, first_name, last_name,
        address, address_line2, state, postal_code, phone_number, avatar_url,
        email_validated, is_admin)
      VALUES ('testuser2', 'testuser2@gmail.com', $1, 'Testy2', 'McTest2',
        '123 Main St', '5', 'CA', 99999, '555.555.5555', 'http://site.com/image.jpg',
        true, false)
      RETURNING *`,
      [hashedPassword]
    );

    TEST_DATA.testUser2 = testUser2Res.rows[0];
    TEST_DATA.testUser2Token = createToken({
      username: 'testuser2',
      user_id: TEST_DATA.testUser2.user_id,
      is_admin: false,
    });
  } catch (error) {
    console.log(error);
  }
}

function addPlaceOrderDataHook(TEST_DATA) {
  TEST_DATA.placeOrderData = {
    cart: {
      items: {
        [TEST_DATA.testProduct.product_id]: {
          product_id: TEST_DATA.testProduct.product_id,
          quantity: 1,
          name: 'TeeVee',
          price: '10.00',
          discount: '0.00',
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
  };
}

async function clearDBTablesHook() {
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
  TEST_DATA,
  beforeAllHook,
  addTestDataHook,
  addUser2Hook,
  addPlaceOrderDataHook,
  clearDBTablesHook,
  afterAllHook,
};
