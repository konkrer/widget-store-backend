const Decimal = require('decimal.js');

// local imports
const db = require('../db');
const {
  calculateSubtotal,
  calculateTax,
  calculateTotal,
} = require('./moneyFuncts');

/**
 * Verify data passed from the frontend in the request is
 * accurate and not corrupt or tamperd with.
 *
 * @param {obj} items items of order
 * @param {string} subtotal subtotal passed from frontend
 * @param {string} tax tax passed from frontend
 * @param {obj} shipping object with shipping data
 * @param {string} total total passed from frontend
 * @param {string} state state customer placed order from
 */
async function verifyOrderDataValid(
  items,
  subtotal,
  tax,
  shipping,
  total,
  state
) {
  // TODO: verify shipping cost

  // verify items price and discount match actual data in DB
  for (let key in items) {
    // get actual price and discount
    const resp = await db.query(
      `SELECT price, discount FROM products WHERE product_id = $1`,
      [key]
    );
    // assert DB data matches request data
    const product = resp.rows[0];
    assert(product.price === items[key].price);
    assert(product.discount === items[key].discount);
  }

  // calculate actual subtotal, tax, and total
  const checkSubtotal = calculateSubtotal(items);
  const checkTax = calculateTax(checkSubtotal, state);
  const checkTotal = calculateTotal(
    checkSubtotal,
    state,
    shipping.details.cost
  );
  // assert request subtotal, tax, and total data is accurate
  try {
    assert(checkSubtotal === subtotal);
    assert(checkTax === tax);
    assert(checkTotal === total);
  } catch (error) {
    const IntegrityError = new Error('Integrity error. Pricing data mismatch.');
    IntegrityError.status = 409;
    throw IntegrityError;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

module.exports = verifyOrderDataValid;
