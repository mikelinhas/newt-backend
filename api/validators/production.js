const Joi = require('joi')

const productionOrderSchema = Joi.object({
  producer_id: Joi.string().required(),
  producer_name: Joi.string().required(),
  items: Joi.array().required(),
})

const create = async (req, res, next) => {
  try {
    const value = await productionOrderSchema.validateAsync(req.body.order, {
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
