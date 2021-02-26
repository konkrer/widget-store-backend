// local imports
// an array of table names that have an "is_active" column
const { IS_ACTIVE_TABLES } = require('../config');

/** sqlForPatchUpdate()
 *
 * Create an SQL statement for a PATCH update
 * which will include all passed key/value pairs
 * in the final update statement except private keys (i.e. "_token").
 *
 * @param {string} table the name of the db table
 * @param {object} items  the table update data
 * @param {string} rowKey the column name which will be used
 *                     to located the db row to update
 * @param {string, integer} rowKeyValue the value of the rowKey
 *                     in the desired row to update
 */

function sqlForPatchUpdate(table, items, rowKey, rowKeyValue) {
  // column update statements array  (i.e. ["name=$1", age=$2])
  const columnUpdateStatements = [];
  // values that will be passed to db.query() as second parameter
  const valuesArray = [];

  // filter out private keys like "_token"
  // then add column update statements
  // and add values to valuesArray
  Object.entries(items)
    .filter(([key]) => !key.startsWith('_'))
    .forEach(([key, val], idx) => {
      columnUpdateStatements.push(`${key}=$${idx + 1}`);
      valuesArray.push(val);
    });

  // For tables that can have a column "is_active"
  // only allow an update if is_active is true.
  // create an addendum to the where clause to accomplish this.
  const isActiveStatement = IS_ACTIVE_TABLES.includes(table)
    ? ' AND is_active = true'
    : '';

  // build query
  // Note: valuesArray will have rowKeyValue added below as the final value.
  //       this is why in WHERE clause it is "valuesArray.length + 1"
  let query = `
    UPDATE ${table}
    SET ${columnUpdateStatements.join(', ')} 
    WHERE ${rowKey}=$${valuesArray.length + 1}
    ${isActiveStatement}
    RETURNING *
    `;

  return { query, values: [...valuesArray, rowKeyValue] };
}

module.exports = sqlForPatchUpdate;
