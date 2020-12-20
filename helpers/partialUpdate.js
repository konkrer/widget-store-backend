/**
 * Generate a selective update query based on a request body:
 *
 * - table: where to make the query
 * - items: an object with keys of columns you want to update and values with updated values
 * - key: the column that we query by (e.g. username, handle, id)
 * - id: current record ID
 *
 * Returns object containing a DB query as a string, and array of
 * string values to be updated
 *
 */

const { IS_ACTIVE_TABLES } = require('../config');

function sqlForPartialUpdate(table, items, key, id) {
  // keep track of item indexes
  // store all the columns we want to update and associate with vals

  let idx = 1;
  let columns = [];

  // filter out keys that start with "_" -- we don't want these in DB
  for (let key in items) {
    if (key.startsWith('_')) {
      delete items[key];
    }
  }

  for (let column in items) {
    columns.push(`${column}=$${idx}`);
    idx += 1;
  }

  // For tables that can have column "is_active"
  // make sure the row is active to allow update.
  const isActive = IS_ACTIVE_TABLES.includes(table)
    ? ' AND is_active = true'
    : '';

  // build query
  let cols = columns.join(', ');
  let query = `UPDATE ${table} SET ${cols} WHERE ${key}=$${idx}${isActive} RETURNING *`;

  let values = Object.values(items);
  values.push(id);

  return { query, values };
}

module.exports = sqlForPartialUpdate;
