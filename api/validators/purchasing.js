const Joi = require('joi')

const purchaseOrderSchema = Joi.object({
  supplier_id: Joi.string().required(),
  supplier_name: Joi.string().required(),
  materials: Joi.array().required(),
})

const create = async (req, res, next) => {
  try {
    const value = await purchaseOrderSchema.validateAsync(req.body.order, {
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
