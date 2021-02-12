const Decimal = require('decimal.js');

const SF_SALES_TAX = new Decimal('0.085');

// calculate discounted price of product
function calculateDiscountPrice(product) {
  if (product.discount === '0.00') return product.price;
  const discount = new Decimal(product.discount),
    price = new Decimal(product.price);
  return price.minus(price.times(discount)).toFixed(2);
}

// calculate items subtotal from items object
function calculateSubtotal(items) {
  return Object.values(items)
    .reduce((acc, product) => {
      const price = new Decimal(calculateDiscountPrice(product));
      const itemTotal = price.times(product.quantity);
      return itemTotal.plus(acc);
    }, 0)
    .toFixed(2);
}

/** Calculate tax if customer is in California */
function calculateTax(subtotal, state) {
  if (!/^ca(lifornia)?$/i.test(state)) return '0.00';
  subtotal = new Decimal(subtotal);
  return subtotal.times(SF_SALES_TAX).toFixed(2);
}

/** Calculate tax plus subtotal plus shipping cost if provided */
function calculateTotal(subtotal, state, shippingCost) {
  const tax = calculateTax(subtotal, state);
  subtotal = new Decimal(subtotal);
  shippingCost = shippingCost || 0;
  return subtotal.plus(tax).plus(shippingCost).toFixed(2);
}

module.exports = {
  calculateDiscountPrice,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
};
