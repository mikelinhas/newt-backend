const Joi = require('joi')

const warehouseMaterialSchema = Joi.object({
  warehouse_id: Joi.string().required(),
  stock: Joi.number().required(),
})

const materialSchema = Joi.object({
  _id: Joi.string(),
  name: Joi.string().required(),
  description: Joi.string().default(''),
  measure_unit: Joi.string().default(''),
  supplier_id: Joi.string().required(),
  external_ref: Joi.string().required(),
  unit_price: Joi.number().default(0),
})

const materialQuerySchema = Joi.object({
  supplier_id: Joi.string(),
  warehouse_id: Joi.string(),
})

const query = async function (req, res, next) {
  try {
    await materialQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

const create = async function (req, res, next) {
  try {
    const value = await materialSchema.validateAsync(req.body)
    req.modifiedBody = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const update = async function (req, res, next) {
  try {
    const value = await materialSchema.validateAsync(req.body, {
      stripUnknown: true,
    })
    req.modifiedBody = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const createWarehouseEntry = async function (req, res, next) {
  try {
    await warehouseMaterialSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

const updateWarehouseEntry = async function (req, res, next) {
  try {
    await warehouseMaterialSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

module.exports = {
  create,
  update,
  query,
  createWarehouseEntry,
  updateWarehouseEntry,
}
