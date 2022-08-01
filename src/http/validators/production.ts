import Joi from 'joi'
import { NextFunction, Request, Response } from 'express'


const productionOrderSchema = Joi.object({
  producer_id: Joi.string().required(),
  producer_name: Joi.string().required(),
  items: Joi.array().required(),
})

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const value = await productionOrderSchema.validateAsync(req.body.order, {
      allowUnknown: true,
    })
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export function update(req: Request, res: Response, next: NextFunction) {
  next()
}

