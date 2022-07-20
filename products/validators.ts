import { Context, HttpRequest } from '@azure/functions'
import { object, string } from 'yup'
import { NextFuction } from '../middleware/handler'

function handleValidationError(context: Context, error: any) {
  context.res = {
    status: 400,
    body: { message: error.message }
  }
}
export async function create(context: Context, req: HttpRequest, next: NextFuction) {
  try {
    const productSchema = object({
      family_id: string().required(),
      color: string().required(),
      size: string().required(),
    })

    const value = await productSchema.validate(req.body)
    req.body = value
    next()
  } catch (error) {
    handleValidationError(context, error)
  }
}

export async function createFamily(req, res, next) {
  try {
    const productFamilySchema = object({
      name: string().required(),
      category: string().required(),
      subcategory: string().required(),
    })
    await productFamilySchema.validate(req.body)
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function updateFamily(req, res, next) {
  try {
    const productFamilySchema = object({
      name: string().required(),
      category: string().required(),
      subcategory: string().required(),
    })
    const value = await productFamilySchema.validate(req.body, {
      stripUnknown: true,
    })
    req.body = value
    next()
  } catch (error) {
    console.error(error)
    res.status(500).send(error)
  }
}

export async function update(context: Context, req: HttpRequest, next: NextFuction) {
  next()
}
