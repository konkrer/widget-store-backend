const db = require('../db');
const sqlForPartialUpdate = require('../utils/partialUpdate');

DEFAULT_LOGO =
  'https://www.af-affinity.co.uk/wp-content/uploads/2015/09/business-icon-reversed.png';

/** Database methods object for distributors. */

class Distributor {
  /** findAll()
   *
   * @param {object} data - The html request query params.
   */

  static async findAll() {
    const distributorsRes = await db.query('SELECT * FROM distributors');

    // Add default logo if necessary and return companies.
    return distributorsRes.rows.map(d =>
      d.logo_url ? d : { ...d, logo_url: DEFAULT_LOGO }
    );
  }

  /** findOne()
   *
   * @param {number} distributor_id - the distributor ID
   */

  static async findOne(id) {
    const distributorRes = await db.query(
      `SELECT *
      FROM distributors
      WHERE distributor_id = $1`,
      [+id]
    );

    const distributor = distributorRes.rows[0];

    if (!distributor) {
      const error = new Error(
        `There exists no distributor with id of: '${id}'`
      );
      error.status = 404; // 404 NOT FOUND
      throw error;
    }

    distributor.logo_url = distributor.logo_url || DEFAULT_LOGO;

    return distributor;
  }

  /** create()
   *
   * @param {object} data - product data object
   */

  static async create(data) {
    const duplicateCheck = await db.query(
      `SELECT name 
            FROM distributors 
            WHERE name = $1`,
      [data.name]
    );

    if (duplicateCheck.rows[0]) {
      let duplicateError = new Error(
        `There already exists a distributor with name '${data.name}`
      );
      duplicateError.status = 409; // 409 Conflict
      throw duplicateError;
    }

    const result = await db.query(
      `INSERT INTO distributors 
              (name, address, phone_number, extension, email, company_contact, website, logo_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
      [
        data.name,
        data.address,
        data.phone_number,
        data.extension,
        data.email,
        data.company_contact,
        data.website,
        data.logo_url,
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

  static async update(id, data) {
    let { query, values } = sqlForPartialUpdate(
      'distributors',
      data,
      'distributor_id',
      id
    );

    const result = await db.query(query, values);
    const distributor = result.rows[0];

    if (!distributor) {
      let notFound = new Error(`There exists no distributor with id: '${id}`);
      notFound.status = 404;
      throw notFound;
    }

    return distributor;
  }

  /** remove()
   *
   * @param {number} product_id - the product id
   */

  static async remove(id) {
    const result = await db.query(
      `DELETE FROM distributors 
          WHERE distributor_id = $1 
          RETURNING distributor_id`,
      [id]
    );

    if (result.rows.length === 0) {
      let notFound = new Error(`There exists no distributor with id: '${id}`);
      notFound.status = 404;
      throw notFound;
    }
  }
}

module.exports = Distributor;
