/** Express app for jobly. */

const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

// add logging system

const morgan = require('morgan');
app.use(morgan('tiny'));

const usersRoutes = require('./routes/users');
const distibutorRoutes = require('./routes/distributors');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');

app.use('/users', usersRoutes);
app.use('/distributors', distibutorRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use('/', authRoutes);

/** 404 handler */

app.use(function (req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;

  // pass the error to the next piece of middleware
  return next(err);
});

/** general error handler */

app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== 'test' && err.stack) console.log(err.stack);

  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message,
  });
});

module.exports = app;
