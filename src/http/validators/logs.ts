import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

const materialLogsQuerySchema = Joi.object({
  sort_field: Joi.string(),
  sort_order: Joi.string(),
  page: Joi.number().integer(),
  per_page: Joi.number().integer(),
})

export async function findMaterialLogs(req: Request, res: Response, next: NextFunction) {
  try {
    await materialLogsQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

