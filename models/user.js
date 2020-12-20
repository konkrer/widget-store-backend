const db = require('../db');
const bcrypt = require('bcrypt');
const partialUpdate = require('../helpers/partialUpdate');

const { BCRYPT_WORK_FACTOR } = require('../config');

/** Related functions for users. */

class User {
  /** authenticate user with username, password. Returns user or throws err. */
  static async authenticate(data) {
    // try to find the user first
    const result = await db.query(
      `SELECT user_id,
              username,
              email,
              first_name,
              last_name,
              avatar_url,
              is_admin
      FROM users
      WHERE email = $1
      AND is_active = true`,
      [data.email]
    );
    const user = result.rows[0];
    if (user) {
      // compare hashed password to a new hash from password
      const isValid = await bcrypt.compare(data.password, user.password);
      if (isValid) {
        return user;
      }
    }
    const invalidPass = new Error('Invalid Credentials');
    invalidPass.status = 401;
    throw invalidPass;
  }
  /** Register user with data. Returns new user data. */
  static async register(data) {
    const duplicateNameCheck = await db.query(
      `SELECT username
            FROM users
            WHERE username = $1`,
      [data.username]
    );
    if (duplicateNameCheck.rows[0]) {
      const err = new Error(
        `There already exists a user with username '${data.username}`
      );
      err.status = 409;
      throw err;
    }
    const duplicateEmailCheck = await db.query(
      `SELECT username
            FROM users
            WHERE email = $1`,
      [data.email]
    );
    if (duplicateEmailCheck.rows[0]) {
      const err = new Error(
        `There already exists a user with email '${data.email}`
      );
      err.status = 409;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users
            (username, email, password, first_name, last_name, address,
              apt_number, state, postal_code, phone_number, avatar_url)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING user_id,
                    username,
                    email,
                    first_name,
                    last_name,
                    avatar_url,
                    is_admin`,
      [
        data.username,
        data.email,
        hashedPassword,
        data.first_name,
        data.last_name,
        data.address,
        data.apt_number,
        data.state,
        data.post_code,
        data.phone_number,
        data.avatar_url,
      ]
    );
    return result.rows[0];
  }
  /** Find all users. */
  static async findAll() {
    const result = await db.query(
      `SELECT username, first_name, last_name, email
          FROM users
          WHERE is_active = true
          ORDER BY username`
    );
    return result.rows;
  }
  /** Given a username, return data about user. */
  static async findOne(username) {
    const userRes = await db.query(
      `SELECT user_id, username, email, first_name, last_name, address, apt_number,
                state, postal_code, phone_number, avatar_url
            FROM users
            WHERE username = $1
            AND is_active = true`,
      [username]
    );
    const user = userRes.rows[0];
    if (!user) {
      const error = new Error(`There exists no user '${username}'`);
      error.status = 404; // 404 NOT FOUND
      throw error;
    }
    const userOrderRes = await db.query(
      `SELECT order_id, order_date, status
           FROM orders
           WHERE customer = $1`,
      [user.user_id]
    );
    user.orders = userOrderRes.rows;
    return user;
  }
  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Return data for changed user.
   *
   */
  static async update(username, data) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, BCRYPT_WORK_FACTOR);
    }
    let { query, values } = partialUpdate('users', data, 'username', username);
    const result = await db.query(query, values);
    const user = result.rows[0];

    if (!user) {
      let notFound = new Error(`There exists no user '${username}`);
      notFound.status = 404;
      throw notFound;
    }
    delete user.password;
    delete user.is_admin;
    return user;
  }
  /** Delete given user from database; returns undefined. */
  static async remove(username) {
    let result = await db.query(
      `UPDATE users
      SET is_active = false
      WHERE username = $1
        AND is_active = true
      RETURNING username`,
      [username]
    );
    if (result.rows.length === 0) {
      let notFound = new Error(`There exists no user '${username}'`);
      notFound.status = 404;
      throw notFound;
    }
  }
}

module.exports = User;
