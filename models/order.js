const db = require('../db');
const braintreeGateway = require('../braintreeGateway');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

/** Related methods for orders. */

class Order {
  /** Find all orders */

  static async findAll() {
    const ordersRes = await db.query(
      `SELECT order_id, status, order_date
      FROM orders ORDER BY order_date DESC LIMIT 50`
    );
    return ordersRes.rows;
  }

  /** Given a order id, return data about order. */

  static async findOne(order_id) {
    const orderRes = await db.query(
      `SELECT o.*, json_agg(op) AS items
       FROM orders AS o
       JOIN orders_products AS op
         ON o.order_id = op.order_id 
       WHERE o.order_id = $1
       GROUP BY o.order_id`,
      [order_id]
    );

    const order = orderRes.rows[0];

    if (!order) {
      const error = new Error(`There exists no order with id: '${order_id}'`);
      error.status = 404; // 404 NOT FOUND
      throw error;
    }

    return order;
  }

  /**
   * Create a new order row from data obj input.
   * Create a new orders_product row for each distinct item in cart (with quantity).
   */

  static async create(data) {
    // destructure data
    const {
      cart: { items, subtotal, numCartItems },
      orderData: {
        customer,
        shipping,
        tax,
        total,
        shippingAddress = null,
        discount = null,
      },
      nonce,
    } = data;
    // var to note if a product would have an in-stock quantity < 0
    let errorProduct;

    try {
      // perform transaction
      await db.query('BEGIN');
      debugger;
      // decrement in-stock quantities for purchased products
      for (let { product_id, quantity, name } of Object.values(items)) {
        // note product being alterd in case error is thrown
        errorProduct = name;
        await db.query(
          `UPDATE products
          SET quantity = quantity - $1
          WHERE product_id = $2`,
          [quantity, product_id]
        );
      }
      errorProduct = null;

      // make brain tree transaction
      let transaction = await braintreeGateway.transaction.sale({
        amount: total,
        paymentMethodNonce: nonce,
        options: {
          submitForSettlement: true,
        },
      });
      if (!transaction.success) throw new Error('Braintree success error');

      // create order record in orders table
      const result = await db.query(
        `INSERT INTO orders (customer, customer_info, total_items_quantity,
        subtotal, discount, tax, shipping_cost, total, shipping_method,
        shipping_address, processor_transaction) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
             RETURNING order_id`,
        [
          customer.user_id || null,
          customer,
          numCartItems,
          subtotal,
          discount,
          tax,
          shipping.details.cost,
          total,
          shipping,
          shippingAddress,
          transaction.transaction,
        ]
      );
      const order = result.rows[0];

      // add orders_products rows for orderd items
      for (let { product_id, quantity } of Object.values(items)) {
        await db.query(`INSERT INTO orders_products VALUES ($1, $2, $3)`, [
          order.order_id,
          product_id,
          quantity,
        ]);
      }

      await db.query('COMMIT');
      return order;
    } catch (error) {
      // rollback and throw error
      await db.query('ROLLBACK');

      // if there was an error adjusting product quantity (errorProduct)
      // show an insufficient quantity message
      const msg = errorProduct
        ? `Insufficient Quantity: "${errorProduct}"`
        : error.message;

      error.message = msg;
      error.status = 409;
      throw error;
    }
  }

  /** Update order data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Return data for changed order.
   *
   */

  static async update(order_id, data) {
    let { query, values } = sqlForPartialUpdate(
      'orders',
      data,
      'order_id',
      order_id
    );
    const result = await db.query(query, values);
    const order = result.rows[0];

    if (!order) {
      let notFound = new Error(`There exists no order with id: '${order_id}`);
      notFound.status = 404;
      throw notFound;
    }

    return order;
  }

  /** Delete given order from database; returns undefined. */

  static async remove(order_id) {
    const result = await db.query(
      `DELETE FROM orders 
            WHERE order_id = $1 
            RETURNING order_id`,
      [order_id]
    );

    if (result.rows.length === 0) {
      let notFound = new Error(`There exists no order '${order_id}`);
      notFound.status = 404;
      throw notFound;
    }
  }
}

module.exports = Order;
