'use strict';

/**
 * Connect to remote production database to create tables and populate seed data.
 */

const { Client } = require('pg');
const fs = require('fs');
const faker = require('faker');
const productImages = require('./fakeProductImages');

// Load .env variables
require('dotenv').config();

// Connect to Production server.
const DB_URI = process.env.DATABASE_URL_PRODUCTION;

// Connect to Dev server.
// const DB_URI = process.env.DATABASE_URL;

/** Create Client */
const client = new Client({
  connectionString: DB_URI,
});

/** Connect Client to DB or throw error */
/* istanbul ignore next */
client.connect().catch(err => {
  console.error(err);
  throw err;
});

const sqlString = fs.readFileSync('dbSetup.sql', 'utf8');

async function addFakeProducts() {
  for (let i = 0; i < 100; i++) {
    try {
      await client.query(
        `
    INSERT INTO products (
        name, byline, description, image_url, price, quantity, net_weight, rating, discount)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)   
    `,
        [
          faker.commerce.productName(),
          `${faker.commerce.productAdjective()} ${faker.commerce.productMaterial()}`,
          faker.commerce.productDescription(),
          productImages[i % productImages.length],
          faker.commerce.price(),
          Math.floor(Math.random() * 50) + 10,
          Math.random() * 30 + 1,
          Math.floor(Math.random() * 5) + 1,
          Math.floor(Math.random() * 2) ? 0 : Math.abs(Math.random() - 0.5),
        ]
      );
    } catch (error) {
      console.log(error);
      if (error.code=='23505') {  // repeated fake name
        i -= 1;
      }
    }
  }

  await client.end();

  console.log('Done!');
}

client
  .query(sqlString)
  .then(res => {
    console.log(res);
    addFakeProducts()
      .then(() => {
        process.exit(0);
      })
      .catch(err => {
        console.log(err);
        process.exit(1);
      });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
