import { NextFunction, Request, Response } from 'express'

import Joi from 'joi'

const ProducerSchema = Joi.object({
  name: Joi.string().required(),
  CIF: Joi.string().required(),
  description: Joi.string().required(),
  email: Joi.string().required(),
  phone: Joi.string().required(),
})

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const value = await ProducerSchema.validateAsync(req.body.producer, {
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
