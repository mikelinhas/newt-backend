const Joi = require('joi')

const bomQuerySchema = Joi.object({
  products: Joi.array(),
})

const bomUpdateSchema = Joi.object({
  material_id: Joi.string().required(),
  quantity: Joi.number().required(),
  upsert: Joi.boolean(),
})

const query = async function (req, res, next) {
  try {
    await bomQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

const update = async function (req, res, next) {
  try {
    await bomUpdateSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

module.exports = { query, update }
