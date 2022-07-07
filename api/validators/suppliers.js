const Joi = require('joi')

const SupplierSchema = Joi.object({
  name: Joi.string().required(),
  CIF: Joi.string().required(),
  description: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  tags: Joi.array().required(),
})

const create = async (req, res, next) => {
  try {
    console.log(req.body.supplier)
    const value = await SupplierSchema.validateAsync(req.body.supplier, {
      allowUnknown: true,
    })
    console.log(value)
    req.sanitizedBody = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

const update = function (req, res, next) {
  next()
}

module.exports = { update, create }
