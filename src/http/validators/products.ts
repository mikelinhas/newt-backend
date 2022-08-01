import Joi from 'joi'
import { NextFunction, Request, Response } from 'express'

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = Joi.object({
      family_id: Joi.string().required(),
      color: Joi.string().required(),
      size: Joi.string().required(),
    })

    const value = await body.validateAsync(req.body)

    req.body = value

    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function createFamily(req: Request, res: Response, next: NextFunction) {
  try {
    const body = Joi.object({
      name: Joi.string().required(),
      category: Joi.string().required(),
      subcategory: Joi.string().required(),
    })

    await body.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function updateFamily(req: Request, res: Response, next: NextFunction) {
  try {
    const body = Joi.object({
      name: Joi.string().required(),
      category: Joi.string().required(),
      subcategory: Joi.string().required(),
    })

    const value = await body.validateAsync(req.body, {
      stripUnknown: true,
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
