// npm packages
const request = require('supertest');
// const { decode } = require('jsonwebtoken');

// app imports
const app = require('../../app');

// model imports
const User = require('../../models/user');

// create test client to call API routes
const client = request(app);

const {
  TEST_DATA,
  addTestDataHook,
  addUser2Hook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../helpers/testsConfig');

beforeAll(async function () {
  await addTestDataHook(TEST_DATA);
  await addUser2Hook(TEST_DATA);
});

afterAll(async function () {
  await clearDBTablesHook();
  await afterAllHook();
});

describe('POST /login', function () {
  test('Authenticates a normal user', async function () {
    let dataObj = {
      email: TEST_DATA.testUser2.email,
      password: TEST_DATA.password,
    };
    const response = await client.post('/login').send(dataObj);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });

  test('Authenticates a admin user', async function () {
    let dataObj = {
      email: TEST_DATA.testUser.email,
      password: TEST_DATA.password,
    };
    const response = await client.post('/login').send(dataObj);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});

describe('POST /admin/login', function () {
  test('Does not authenticates a normal user', async function () {
    let dataObj = {
      email: TEST_DATA.testUser2.email,
      password: TEST_DATA.password,
    };
    const response = await client.post('/admin/login').send(dataObj);
    expect(response.statusCode).toBe(401);
  });

  test('Authenticates a admin user', async function () {
    let dataObj = {
      email: TEST_DATA.testUser.email,
      password: TEST_DATA.password,
    };
    const response = await client.post('/admin/login').send(dataObj);
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
  });
});
