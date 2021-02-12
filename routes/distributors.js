/** Routes for distributors. */

const express = require('express');
const router = new express.Router();

const { adminRequired, authRequired } = require('../middleware/auth');

const Distributor = require('../models/distributor');
const { validate } = require('jsonschema');

const distributorSchema = require('../schemas/distributorSchema.json');
const distributorUpdateSchema = require('../schemas/distributorUpdateSchema.json');

/** GET /  =>  {distributors: [distributor, distributor]}  */

router.get('/', authRequired, async function (req, res, next) {
  const distributors = await Distributor.findAll();
  return res.json({ distributors });
});

/** GET /[distributorId]  =>  {distributor: distributor} */

router.get('/:id', authRequired, async function (req, res, next) {
  try {
    const distributor = await Distributor.findOne(req.params.id);
    return res.json({ distributor });
  } catch (err) {
    return next(err);
  }
});

/** POST / {distributorData} =>  {distributor: newDistributor} */

router.post('/', adminRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, distributorSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const distributor = await Distributor.create(req.body);
    return res.status(201).json({ distributor }); // 201 CREATED
  } catch (err) {
    return next(err);
  }
});

/** PATCH /[distributorId] {distributorData} => {distributor: updatedDistributor}  */

router.patch('/:id', adminRequired, async function (req, res, next) {
  try {
    const validation = validate(req.body, distributorUpdateSchema);
    if (!validation.valid) {
      return next({
        status: 400,
        message: validation.errors.map(e => e.stack),
      });
    }

    const distributor = await Distributor.update(req.params.id, req.body);
    return res.json({ distributor });
  } catch (err) {
    return next(err);
  }
});

/** DELETE /[distributorId]  =>  {message: "Distributor deleted"}  */

router.delete('/:id', adminRequired, async function (req, res, next) {
  try {
    await Distributor.remove(req.params.id);
    return res.json({ message: 'Distributor deleted' });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
