import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    const bomQuerySchema = Joi.object({
      products: Joi.array(),
    })
    await bomQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const bomUpdateSchema = Joi.object({
      material_id: Joi.string().required(),
      quantity: Joi.number().required(),
      upsert: Joi.boolean(),
    })
    await bomUpdateSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

