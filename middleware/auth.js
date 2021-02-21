/** Route authorization middleware. */

const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');

/** authRequired()
 *
 * Ensure the request token has a valid signature.
 *
 * Add user data onto req as a convenience for view functions.
 *
 * If not, raises Unauthorized.
 */

function authRequired(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;
    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;
    req.user_id = token.user_id;
    req.is_admin = token.is_admin;
    return next();
  } catch (err) {
    let unauthorized = new Error('You must authenticate first.');
    unauthorized.status = 401; // 401 Unauthorized
    return next(unauthorized);
  }
}

/** adminRequired()
 *
 * Ensure the verified and decoded request token:
 *  - Is an admin token.
 *
 * Add user data onto req as a convenience for view functions.
 *
 * If not, raises Unauthorized.
 */

function adminRequired(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;

    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;
    req.user_id = token.user_id;
    req.is_admin = token.is_admin;

    if (token.is_admin) {
      return next();
    }

    throw new Error();
  } catch (err) {
    const unauthorized = new Error('You must be an admin to access.');
    unauthorized.status = 401;

    return next(unauthorized);
  }
}

/** ensureCorrectUser()
 *
 * Ensure the verified and decoded request token has either:
 *  - An id matching the path id parameter
 *  - A username matching the path username parameter
 *  - Or is an admin token.
 *
 * Add user data onto req as a convenience for view functions.
 *
 * If not, raises Unauthorized.
 */

function ensureCorrectUser(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;

    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;
    req.user_id = token.user_id;
    req.is_admin = token.is_admin;

    if (
      token.is_admin ||
      token.username === req.params.username ||
      token.user_id === req.params.id
    ) {
      return next();
    }

    throw new Error();
  } catch (e) {
    const unauthorized = new Error('You are not authorized.');
    unauthorized.status = 401;

    return next(unauthorized);
  }
}

module.exports = {
  authRequired,
  adminRequired,
  ensureCorrectUser,
};
