/** Routes for users. */

const express = require('express');
const router = express.Router();

const { ensureCorrectUser, adminRequired } = require('../middleware/auth');

const User = require('../models/user');
const { validate } = require('jsonschema');

const userNewSchema = require('../schemas/userNewSchema.json');
const userUpdateSchema = require('../schemas/userUpdateSchema.json');

const createToken = require('../helpers/createToken');

/** GET / => {users: [user, ...]} */

router.get('/', adminRequired, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});

/** GET /[username] => {user: user} */

router.get('/:username', ensureCorrectUser, async function (req, res, next) {
  try {
    const user = await User.findOne(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** POST / {userdata}  => {token: token} */

router.post('/', async function (req, res, next) {
  try {
    debugger;
    const validation = validate(req.body, userNewSchema);

    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const newUser = await User.register(req.body);
    const token = createToken(newUser);
    return res.status(201).json({ token, user: newUser });
  } catch (e) {
    return next(e);
  }
});

/**
 * PATCH /[username] {userData} => {user: updatedUser}
 *
 * body.verify_password used to authenticate user (required).
 * body.password used to update password (optional).
 *
 * New token returned on username update.
 */

router.patch('/:username', ensureCorrectUser, async function (req, res, next) {
  try {
    if ('user_id' in req.body || 'is_admin' in req.body) {
      return next({ status: 400, message: 'Not allowed' });
    }

    // await User.authenticate({
    //   username: req.params.username,
    //   password: req.body.verify_password,
    // });
    // delete req.body.verify_password;

    const validation = validate(req.body, userUpdateSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const user = await User.update(req.params.username, req.body);

    // if changed username create new token.
    if (req.body.username !== req.params.username) {
      var token = createToken(user);
    }
    return token ? res.json({ user, token }) : res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[username]  =>  {message: "User deleted"}  */

router.delete('/:username', ensureCorrectUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ message: 'User deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
