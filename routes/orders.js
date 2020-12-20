/** Routes for orders. */

const express = require('express');
const router = express.Router({ mergeParams: true });

const {
  adminRequired,
  ensureCorrectUserId,
  authRequired,
} = require('../middleware/auth');

const Order = require('../models/order');
const { validate } = require('jsonschema');

const orderSchema = require('../schemas/orderSchema.json');
const orderUpdateSchema = require('../schemas/orderUpdateSchema.json');

/** GET / => {orders: [order, ...]} */

router.get('/', adminRequired, async function (req, res, next) {
  try {
    const orders = await Order.findAll(req.query);
    return res.json({ orders });
  } catch (err) {
    return next(err);
  }
});

/** GET /[orderId] => {order: order} */

router.get('/:id', authRequired, async function (req, res, next) {
  try {
    const order = await Order.findOne(req.params.id);

    if (!req.is_admin && order.customer !== req.user_id) {
      const authError = new Error('You are unauthorized to view this order.');
      authError.status = 401;
      throw authError;
    }

    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

/** POST / {orderData} => {order: order} */

router.post('/', authRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, orderSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const order = await Order.create(req.body);
    return res.status(201).json({ order });
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[orderId]  {orderData} => {order: updatedOrder} */

router.patch('/:id', adminRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, orderUpdateSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const order = await Order.update(req.params.id, req.body);
    return res.json({ order });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[orderId]  =>  {message: "Order deleted"}  */

router.delete('/:id', adminRequired, async function (req, res, next) {
  try {
    await Order.remove(req.params.id);
    return res.json({ message: 'Order deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
