const Joi = require('joi')

const productSchema = Joi.object({
  family_id: Joi.string().required(),
  color: Joi.string().required(),
  size: Joi.string().required(),
})

const productFamilySchema = Joi.object({
  name: Joi.string().required(),
  category: Joi.string().required(),
  subcategory: Joi.string().required(),
})

const create = async function (req, res, next) {
  try {
    const value = await productSchema.validateAsync(req.body)
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const createFamily = async function (req, res, next) {
  try {
    await productFamilySchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const updateFamily = async function (req, res, next) {
  try {
    const value = await productFamilySchema.validateAsync(req.body, {
      stripUnknown: true,
    })
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const update = function (req, res, next) {
  next()
}

module.exports = { update, create, createFamily, updateFamily }
