import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

const purchaseOrderSchema = Joi.object({
  supplier_id: Joi.string().required(),
  supplier_name: Joi.string().required(),
  materials: Joi.array().required(),
})

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const value = await purchaseOrderSchema.validateAsync(req.body.order, {
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

