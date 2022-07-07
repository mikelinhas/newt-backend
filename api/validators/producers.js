const Joi = require('joi')

const ProducerSchema = Joi.object({
  name: Joi.string().required(),
  CIF: Joi.string().required(),
  description: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
})

const create = async (req, res, next) => {
  try {
    const value = await ProducerSchema.validateAsync(req.body.producer, {
      allowUnknown: true,
    })
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
