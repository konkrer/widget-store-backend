/** Routes for authentication. */

const express = require('express');
const router = new express.Router();
const { validate } = require('jsonschema');

const userAuthSchema = require('../schemas/userAuthSchema.json');
const createToken = require('../utils/createToken');
const User = require('../models/user');

router.post('/login', async function (req, res, next) {
  try {
    const validation = validate(req.body, userAuthSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }
    const user = await User.authenticate(req.body);
    const token = createToken(user);
    delete user.is_admin;
    return res.json({ token, user });
  } catch (e) {
    return next(e);
  }
});

router.post('/admin/login', async function (req, res, next) {
  try {
    const validation = validate(req.body, userAuthSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }
    const user = await User.authenticate(req.body);
    if (!user.is_admin) {
      const adminError = new Error('User must be an admin!');
      adminError.status = 401;
      throw adminError;
    }
    const token = createToken(user);
    delete user.is_admin;
    return res.json({ token, user });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
