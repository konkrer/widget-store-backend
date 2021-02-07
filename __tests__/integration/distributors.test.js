// npm packages
const request = require('supertest');

// app imports
const app = require('../../app');

// create test client to call API routes
const client = request(app);

const {
  TEST_DATA,
  beforeAllHook,
  addTestDataHook,
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
});

describe('GET /distributors', function () {
  test('Gets a list of all distributors', async function () {
    const response = await client
      .get('/distributors')
      .send({ _token: TEST_DATA.testUserToken });
    expect(response.body.distributors).toHaveLength(1);
    expect(response.body.distributors[0]).toHaveProperty('name');
  });
});

describe('GET /distributors/:id', function () {
  test('Gets a single a distributor', async function () {
    const response = await client
      .get(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
      });
    expect(response.body.distributor).toHaveProperty('name');
    expect(response.body.distributor.name).toBe('DistCo');
  });

  test('Responds with a 404 if it cannot find the distributor in question', async function () {
    const response = await client.get(`/distributors/0`).send({
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /distributors', function () {
  test('Creates a new distributor', async function () {
    const response = await client.post('/distributors').send({
      name: 'Products 4U',
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.distributor).toHaveProperty('name');
    expect(response.body.distributor.name).toEqual('Products 4U');
  });

  test('Prevents creating a distributor with duplicate name', async function () {
    const response = await client.post('/distributors').send({
      _token: TEST_DATA.testUserToken,
      name: 'DistCo',
    });
    expect(response.statusCode).toBe(409);
  });
});

describe('PATCH /distributors/:id', function () {
  test("Updates a single a distributor's name", async function () {
    const response = await client
      .patch(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({
        name: 'xkcd',
        _token: TEST_DATA.testUserToken,
      });
    expect(response.body.distributor).toHaveProperty('name');
    expect(response.body.distributor.name).toBe('xkcd');
  });

  test('Prevents a bad distributor update', async function () {
    const response = await client
      .patch(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
        cactus: false,
      });
    expect(response.statusCode).toBe(400);
  });

  test('Responds with a 404 if it cannot find the distributor', async function () {
    // delete distributor first
    await client
      .delete(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({ _token: TEST_DATA.testUserToken });
    const response = await client
      .patch(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({
        name: 'notgonnawork',
        _token: TEST_DATA.testUserToken,
      });
    expect(response.statusCode).toBe(404);
  });
});

describe('DELETE /distributors/:id', function () {
  test('Deletes a single a distributor', async function () {
    const response = await client
      .delete(`/distributors/${TEST_DATA.testDistributor.distributor_id}`)
      .send({
        _token: TEST_DATA.testUserToken,
      });
    expect(response.body).toEqual({ message: 'Distributor deleted' });
  });

  test('Responds with a 404 if it cannot find the distributor in question', async function () {
    // delete distributor first
    const response = await client.delete(`/distributors/0`).send({
      _token: TEST_DATA.testUserToken,
    });
    expect(response.statusCode).toBe(404);
  });
});
