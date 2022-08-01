import { Request, Response, NextFunction } from "express"

import Joi from 'joi'

const SupplierSchema = Joi.object({
  name: Joi.string().required(),
  CIF: Joi.string().required(),
  description: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
  tags: Joi.array().required(),
})

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    console.log(req.body.supplier)
    const value = await SupplierSchema.validateAsync(req.body.supplier, {
      allowUnknown: true,
    })
    console.log(value)
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

