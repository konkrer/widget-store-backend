// npm packages
const request = require('supertest');

// local imports
const app = require('../../app');

// create test client to call API routes
const client = request(app);

const {
  TEST_DATA,
  addTestDataHook,
  clearDBTablesHook,
  afterAllHook,
} = require('../../utils/testsConfig');

// this needs to run before each test to prevent error
beforeEach(async function () {
  await addTestDataHook(TEST_DATA);
});

afterEach(async function () {
  await clearDBTablesHook();
});

afterAll(async function () {
  await afterAllHook();
});

describe('Error handling', () => {
  test('GET requests should return 404 status for bad urls', async () => {
    const res = await client.get('/badURL');

    expect(res.statusCode).toBe(404);
  });
});
