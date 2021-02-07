const db = require('../db');
const sqlForPartialUpdate = require('../helpers/partialUpdate');

/** Related methods for products. */

class Product {
  /** Find all products (can filter on terms in data). */

  static async findAll(data) {
    let baseQuery = `
      SELECT product_id, name, byline, image_url, price, discount, rating
      FROM products`;
    let whereExpressions = [];
    let queryValues = [];
    let orderBy = '';

    // For each possible search term, add to whereExpressions and
    // queryValues so we can generate the right SQL

    if (data.query) {
      queryValues.push(`%${data.query}%`);
      whereExpressions.push(`name ILIKE $${queryValues.length}`);
    }

    if (data.max_price) {
      queryValues.push(+data.max_price);
      whereExpressions.push(`price <= $${queryValues.length}`);
    }

    if (data.min_price) {
      queryValues.push(+data.min_price);
      whereExpressions.push(`price >= $${queryValues.length}`);
    }

    if (data.department) {
      queryValues.push(data.department);
      whereExpressions.push(`department = $${queryValues.length}`);
    }

    if (
      // all sort parameters present and correct
      data.order_by &&
      data.order_by_sort &&
      ['name', 'rating', 'date_added', 'price'].includes(data.order_by) &&
      ['asc', 'desc'].includes(data.order_by_sort)
    )
      orderBy = ` ORDER BY ${data.order_by} ${data.order_by_sort}`;
    else {
      orderBy = ' ORDER BY rating desc';
    }

    if (whereExpressions.length > 0) baseQuery += ' WHERE ';

    // Finalize query and return results

    let finalQuery = baseQuery + whereExpressions.join(' AND ') + orderBy;
    const productsRes = await db.query(finalQuery, queryValues);
    return productsRes.rows;
  }

  /** Given a product id, return data about product. */

  static async findOne(product_id) {
    const productRes = await db.query(
      `SELECT product_id, name, byline, description, image_url, price, discount, date_added, quantity, rating 
       FROM products 
       WHERE product_id = $1`,
      [product_id]
    );

    const product = productRes.rows[0];

    if (!product) {
      const error = new Error(
        `There exists no product with id: '${product_id}'`
      );
      error.status = 404; // 404 NOT FOUND
      throw error;
    }

    return product;
  }

  /** Create a product (from data), update db, return new product data. */

  static async create(data) {
    // duplicate name check
    const productRes = await db.query(
      `SELECT * FROM products WHERE name = $1`,
      [data.name]
    );
    if (productRes.rows[0]) {
      const dupError = new Error('A product with this name already exists.');
      dupError.status = 409;
      throw dupError;
    }

    const result = await db.query(
      `INSERT INTO products (name, description, image_url, price, quantity, distributor, sku, net_weight) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
             RETURNING product_id, name, description, image_url, price,
               quantity, distributor, sku, date_added`,
      [
        data.name,
        data.description,
        data.image_url,
        data.price,
        data.quantity,
        data.distributor,
        data.sku,
        data.net_weight,
      ]
    );

    return result.rows[0];
  }

  /** Update product data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Return data for changed product.
   *
   */

  static async update(product_id, data) {
    let { query, values } = sqlForPartialUpdate(
      'products',
      data,
      'product_id',
      product_id
    );

    const result = await db.query(query, values);
    const product = result.rows[0];

    if (!product) {
      let notFound = new Error(
        `There exists no product with id: '${product_id}`
      );
      notFound.status = 404;
      throw notFound;
    }

    return product;
  }

  /** Delete given product from database; returns undefined. */

  static async remove(product_id) {
    const result = await db.query(
      `UPDATE products 
      SET is_active = false
      WHERE product_id = $1 
        AND is_active = true
      RETURNING product_id`,
      [product_id]
    );

    if (result.rows.length === 0) {
      let notFound = new Error(`There exists no product '${product_id}`);
      notFound.status = 404;
      throw notFound;
    }
  }
}

module.exports = Product;
