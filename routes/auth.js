/** Routes for authentication. */

const User = require('../models/user');
const express = require('express');
const router = new express.Router();

const createToken = require('../helpers/createToken');
const { validate } = require('jsonschema');
const { userAuthSchema } = require('../schemas/userAuthSchema.json');

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
    return res.json({ token });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
