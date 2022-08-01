import { NextFunction, Request, Response } from 'express'
import Joi from 'joi'

const warehouseMaterialSchema = Joi.object({
  warehouse_id: Joi.string().required(),
  stock: Joi.number().required(),
})

const materialSchema = Joi.object({
  _id: Joi.string(),
  name: Joi.string().required(),
  description: Joi.string().default(''),
  measure_unit: Joi.string().default(''),
  supplier_id: Joi.string().required(),
  external_ref: Joi.string().required(),
  unit_price: Joi.number().default(0),
})

const materialQuerySchema = Joi.object({
  supplier_id: Joi.string(),
  warehouse_id: Joi.string(),
})

export async function query(req: Request, res: Response, next: NextFunction) {
  try {
    await materialQuerySchema.validateAsync(req.query)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const value = await materialSchema.validateAsync(req.body)
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const value = await materialSchema.validateAsync(req.body, {
      stripUnknown: true,
    })
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function createWarehouseEntry(req: Request, res: Response, next: NextFunction) {
  try {
    await warehouseMaterialSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

export const updateWarehouseEntry = async function (req: Request, res: Response, next: NextFunction) {
  try {
    await warehouseMaterialSchema.validateAsync(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(400).send(error)
  }
}

