/** Database setup for widget-store. */

const { Client } = require('pg');
const { DB_URI } = require('./config');

/** When deployed to Heroku DB_URI will start with "postgres://" -
 * if so set ssl to configuration object as below.
 *
 * Otherwise set ssl null for development.  */
/* istanbul ignore next */
const ssl = DB_URI.startsWith('postgres://')
  ? { rejectUnauthorized: false }
  : null;

/** Create Client */
const client = new Client({
  connectionString: DB_URI,
  ssl,
});

/** Connect Client to DB or throw error */
/* istanbul ignore next */
client.connect().catch(err => {
  console.error(err);
  throw err;
});

module.exports = client;
