const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');
const Product = require('./product');

/** Related methods for orders. */

class Order {
  /** Find all orders */

  static async findAll() {
    const ordersRes = await db.query(
      'SELECT order_id, status, order_date FROM orders ORDER BY order_date DESC'
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
   *
   * Input note: data.items is array -> [[product_id, quantity], [product_id, quantity]]
   *
   * returns order obj with order.items array -> [{order_id, product_id, quantity}].
   */

  static async create(data) {
    // confirm sufficient quantity of items in stock.
    const inStock = await Product.decrementOrderProducts(data.items);
    if (!inStock) {
      const quantErr = new Error(
        'Insufficient quantity of product to place order.'
      );
      quantErr.status = 409;
      throw quantErr;
    }

    const result = await db.query(
      `INSERT INTO orders (customer, distinct_cart_items, total_items_quantity,
        subtotal, tax, shipping_cost, total, shipping_method, tracking_number,
        shipping_address) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING order_id, customer, distinct_cart_items, total_items_quantity,
                subtotal, tax, shipping_cost, total, shipping_method, tracking_number,
                shipping_address`,
      [
        data.customer,
        data.distinct_cart_items,
        data.total_items_quantity,
        data.subtotal,
        data.tax,
        data.shipping_cost,
        data.total,
        data.shipping_method,
        data.tracking_number,
        data.shipping_address,
      ]
    );
    const order = result.rows[0];

    // add needed orders_products rows for data.items (orderd products)
    // and make order.items array to return
    order.items = await data.items.reduce(async (acc, [p_id, quantity]) => {
      const res = await db.query(
        `INSERT INTO orders_products VALUES ($1, $2, $3) RETURNING *`,
        [order.order_id, p_id, quantity]
      );
      acc.push(res.rows[0]);
      return acc;
    }, []);

    return order;
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
