const db = require('../db');
const sqlForPartialUpdate = require('../utils/partialUpdate');

/** Database methods object for products. */

class Product {
  /** findAll()
   *
   * @param {object} data - The html request query params.
   */

  static async findAll(data) {
    let baseQuery = `
      SELECT product_id, name, byline, image_url, price, discount, rating
      FROM products`;
    let whereExpressions = [];
    let queryValues = [];
    let orderBy = '';
    const limit = ' LIMIT 63';

    // For each possible filtering term, add to the where expression.

    // If there is a base category of products (e.g. new, deals)
    // get product_id's for that category group. All other selections below
    // will be from within this category group.
    if (data.category) {
      const { ids, escapedIDString } = await this.getCategoryIDs(data.category);
      queryValues.push(...ids);
      whereExpressions.push(`product_id in ( ${escapedIDString} )`);

      // If orderby is not set, set orderby based on the category.
      if (!data.order_by) {
        data.order_by = data.category === 'deals' ? 'discount' : 'date_added';
        data.order_by_sort = 'desc';
      }
    }

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

    // ORDER BY clause
    if (
      // If all sort parameters present and correct use to set statement.
      data.order_by &&
      data.order_by_sort &&
      ['name', 'rating', 'date_added', 'price', 'discount'].includes(
        data.order_by
      ) &&
      ['asc', 'desc'].includes(data.order_by_sort)
    )
      orderBy = ` ORDER BY ${data.order_by} ${data.order_by_sort}`;
    else {
      orderBy = ' ORDER BY rating DESC';
    }

    if (whereExpressions.length > 0) baseQuery += ' WHERE ';

    // Finalize query and return results

    let finalQuery =
      baseQuery + whereExpressions.join(' AND ') + orderBy + limit;

    const productsRes = await db.query(finalQuery, queryValues);
    return productsRes.rows;
  }

  /** findOne()
   *
   * @param {number} product_id - the product ID
   */

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

  /** create()
   *
   * @param {object} data - product data object
   */

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
      `INSERT INTO products (name, byline, description, image_url, price, discount,
        quantity, department, distributor, sku, net_weight, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        data.name,
        data.byline || null,
        data.description,
        data.image_url || null,
        data.price,
        data.discount || 0.0,
        data.quantity || 0,
        data.department || 'All Departments',
        data.distributor || null,
        data.sku || null,
        data.net_weight,
        data.is_active || true,
      ]
    );

    return result.rows[0];
  }

  /** update()
   * (PATCH)
   *
   * @param {number} product_id
   * @param {object} data
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

  /** remove()
   *
   * @param {number} product_id - the product id
   */

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

  /** getCategoryIDs()
   *
   * @param {string} category
   *
   * For a given base category of products (e.g. new, deals)
   * get a set of product ids that represent
   * that category. Those id's are then returned as
   * a array of id numbers (e.g. [1,2,3]) and a SQL injection
   * escape character string (e.g. "$1, $2, <...>")
   *
   */
  static async getCategoryIDs(category) {
    let sqlStatement;

    switch (category) {
      case 'newProducts': {
        sqlStatement = `SELECT product_id FROM products ORDER BY date_added DESC LIMIT 500`;
        break;
      }
      case 'deals': {
        sqlStatement = `SELECT product_id FROM products WHERE discount > 0`;
        break;
      }
      default:
        sqlStatement = `SELECT product_id FROM products WHERE discount > 0`;
    }

    const resp = await db.query(sqlStatement);

    const ids = resp.rows.map(row => row.product_id);
    const escapedIDString = resp.rows.map((row, i) => `$${i + 1}`).join(', ');

    return { ids, escapedIDString };
  }
}

module.exports = Product;
