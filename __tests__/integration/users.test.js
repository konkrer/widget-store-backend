// npm packages
const request = require('supertest');
const { decode } = require('jsonwebtoken');

// app imports
const app = require('../../app');

// model imports
const User = require('../../models/user');

// create test client to call API routes
const client = request(app);

const {
  TEST_DATA,
  beforeAllHook,
  addTestDataHook,
  clearDBTablesHook,
  afterAllHook,
  addUser2Hook,
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

describe('POST /users', function () {
  test('Creates a new user', async function () {
    let dataObj = {
      username: 'GillyWoo',
      email: 'gilly@gmail.com',
      password: 'foo123FOOFOO',
      first_name: 'Gilly',
      last_name: 'Woofles',
    };
    const response = await client.post('/users').send(dataObj);
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('token');
    const gillyInDb = await User.findOne('GillyWoo');
    ['username', 'first_name', 'last_name', 'email'].forEach(key => {
      expect(dataObj[key]).toEqual(gillyInDb[key]);
    });
  });

  test('Prevents creating a user with duplicate username', async function () {
    const response = await client.post('/users').send({
      username: 'testuser',
      first_name: 'Testy',
      password: 'foo123FOO',
      last_name: 'McTest',
      email: 'abc@cde.com',
    });
    expect(response.statusCode).toBe(409);
  });

  test('Prevents creating a user with duplicate email', async function () {
    const response = await client.post('/users').send({
      username: 'newname',
      first_name: 'Testy',
      password: 'foo123FOO',
      last_name: 'McTest',
      email: 'testuser@gmail.com',
    });
    expect(response.statusCode).toBe(409);
  });

  test('Prevents creating a user without required password field', async function () {
    const response = await client.post('/users').send({
      username: 'newname',
      first_name: 'Testy',
      last_name: 'McTester',
      email: 'test@rithmschool.com',
    });
    expect(response.statusCode).toBe(400);
  });
});

describe('GET /users', function () {
  test('Gets a list of all users', async function () {
    const response = await client
      .get('/users')
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0]).toHaveProperty('username');
    expect(response.body.users[0]).not.toHaveProperty('password');

    await addUser2Hook(TEST_DATA);

    const response2 = await client
      .get('/users')
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response2.body.users).toHaveLength(2);
  });
});

describe('GET /users/:username', function () {
  test('Gets a single a user', async function () {
    const response = await client
      .get(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.body.user).toHaveProperty('username');
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body.user.username).toBe('testuser');
  });

  test('Responds with a 401 if username does not match token', async function () {
    const response = await client
      .get(`/users/yaaasss`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(401);
  });

  test('Responds with a 401 if no token', async function () {
    const response = await client.get(`/users/yaaasss`);
    expect(response.statusCode).toBe(401);
  });

  test('User not present after delete', async function () {
    await client
      .delete(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: TEST_DATA.testUserToken });
    const response = await client
      .get(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.body).toHaveProperty('error');
  });
});

describe('PATCH /users/:username', function () {
  test("Updates a single a user's first_name with a selective update", async function () {
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({
        first_name: 'Homer',
        _token: `${TEST_DATA.testUserToken}`,
      });
    const user = response.body.user;
    expect(user).toHaveProperty('username');
    expect(user).not.toHaveProperty('password');
    expect(user.first_name).toBe('Homer');
    expect(user.username).toBe('testuser');
  });

  test("Updates a single a user's password", async function () {
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}`, password: 'foo123FOO45' });

    const user = response.body.user;
    expect(user).toHaveProperty('username');
    expect(user).not.toHaveProperty('password');
  });

  test('Prevents a bad user update', async function () {
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ cactus: false, _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(400);
  });

  test('Responds with a 401 if token does not match username', async function () {
    const response = await client
      .patch(`/users/bunny`)
      .send({ password: 'foo123FOO45', _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(401);
  });

  test('Responds with a 404 if it cannot find the user in question', async function () {
    // delete user first
    await client
      .delete(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ password: 'foo123FOO45', _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(404);
  });

  test('Returns new token if username is changed', async function () {
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ username: 'foo123FOO45', _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(decode(response.body.token).username).toEqual('foo123FOO45');
  });

  test('Returns 400 user_id or is_admin in data', async function () {
    const response = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ user_id: 'foo123FOO45', _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe('Not allowed');

    const response2 = await client
      .patch(`/users/${TEST_DATA.testUser.username}`)
      .send({ is_admin: true, _token: `${TEST_DATA.testUserToken}` });
    expect(response2.statusCode).toBe(400);
    expect(response2.body.message).toBe('Not allowed');
  });
});

describe('DELETE /users/:username', function () {
  test('Deletes a single a user', async function () {
    const response = await client
      .delete(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.body).toEqual({ message: 'User deleted' });
  });

  test('Forbids a user from deleting another user', async function () {
    const response = await client
      .delete(`/users/notme`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(401);
  });

  test('Responds with a 404 if it cannot find the user in question', async function () {
    // delete user first
    await client
      .delete(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    const response = await client
      .delete(`/users/${TEST_DATA.testUser.username}`)
      .send({ _token: `${TEST_DATA.testUserToken}` });
    expect(response.statusCode).toBe(404);
  });
});
