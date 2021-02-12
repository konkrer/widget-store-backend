/** Routes for products. */

const express = require('express');
const router = express.Router({ mergeParams: true });

const { adminRequired } = require('../middleware/auth');

const Product = require('../models/product');
const { validate } = require('jsonschema');

const productSchema = require('../schemas/productSchema.json');
const productUpdateSchema = require('../schemas/productUpdateSchema.json');

/** GET / => {products: [product, ...]} */

router.get('/', async function (req, res, next) {
  const products = await Product.findAll(req.query);
  return res.json({ products });
});

/** GET /[productId] => {product: product} */

router.get('/:id', async function (req, res, next) {
  try {
    const product = await Product.findOne(req.params.id);
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
});

/** POST / {productData} => {product: product} */

router.post('/', adminRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, productSchema);

    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const product = await Product.create(req.body);
    return res.status(201).json({ product });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[productId]  {productData} => {product: updatedProduct} */

router.patch('/:id', adminRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, productUpdateSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const product = await Product.update(req.params.id, req.body);
    return res.json({ product });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[productId]  =>  {message: "Product deleted"}  */

router.delete('/:id', adminRequired, async function (req, res, next) {
  try {
    await Product.remove(req.params.id);
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
