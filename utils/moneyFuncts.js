/** Functions for basic money calculations for widget-store. */

const Decimal = require('decimal.js');

const SF_SALES_TAX = '0.085';

/** calculateDiscountPrice()
 *
 * Calculate discounted price from product object.
 * Product object should have properties "price"
 * and "discount".
 * @param {object} product
 *
 * returns: string
 */

function calculateDiscountPrice(product) {
  if (product.discount === '0.00') return product.price;
  const price = new Decimal(product.price);
  return price.minus(price.times(product.discount)).toFixed(2);
}

/** calculateSubtotal()
 *
 * Calculate items subtotal from cart.items object.
 * Each cart item should have properties "price", "discount",
 * and "quantity" of items ordered.
 *
 * @param {object} items {product_id: item, product_id: item}
 *
 * returns: string
 */

function calculateSubtotal(items) {
  return Object.values(items)
    .reduce((acc, product) => {
      const price = new Decimal(calculateDiscountPrice(product));
      const itemTotal = price.times(product.quantity);
      return itemTotal.plus(acc);
    }, 0)
    .toFixed(2);
}

/** calculateTax()
 *
 * Calculate tax if customer is in California.
 * @param {string} subtotal
 * @param {string} state
 *
 * returns: string
 */

function calculateTax(subtotal, state) {
  if (!/^ca(lifornia)?$/i.test(state)) return '0.00';
  subtotal = new Decimal(subtotal);
  return subtotal.times(SF_SALES_TAX).toFixed(2);
}

/** calculateTotal()
 *
 * Calculate subtotal plus tax, plus shipping cost if provided.
 * @param {string} subtotal
 * @param {string} state
 * @param {string||number} shippingCost
 *
 * returns: string
 */

function calculateTotal(subtotal, state, shippingCost) {
  subtotal = new Decimal(subtotal);
  const tax = calculateTax(subtotal, state);
  shippingCost = shippingCost || 0;
  return subtotal.plus(tax).plus(shippingCost).toFixed(2);
}

module.exports = {
  calculateDiscountPrice,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
};
