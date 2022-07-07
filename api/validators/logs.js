const Joi = require('joi')

const materialLogsQuerySchema = Joi.object({
  sort_field: Joi.string(),
  sort_order: Joi.string(),
  page: Joi.number().integer(),
  per_page: Joi.number().integer(),
})

const findMaterialLogs = async function (req, res, next) {
  try {
    await materialLogsQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

module.exports = { findMaterialLogs }
