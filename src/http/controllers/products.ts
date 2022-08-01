
import { Request, Response } from "express"
import { HttpServices } from "../../app"
import { ProductFamilyCreateRequest, ProductFamilyUpdateRequest } from "../../domains/productfamilies/models"
import { ProductFamilyService } from "../../domains/productfamilies/service"
import { ProductCreateRequest, ProductUpdateRequest } from "../../domains/products/models"
import { ProductService } from "../../domains/products/service"
import { errorHandler } from "./utils/errors"

let productService: ProductService;
let productFamilyService: ProductFamilyService;

export function initializeServices(services: HttpServices) {
  productService = services.productService
  productFamilyService = services.productFamilyService
}


// Products
export async function find(req: Request, res: Response) {
  try {
    const query = req.query || {}
    console.log(query)
    const result = await productService.find()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function findFamilies(req: Request, res: Response) {
  try {
    const result = productFamilyService.find()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function findFamily(req: Request, res: Response) {
  try {
    const result = await productFamilyService.findById(req.params.id)
    res.status(200).send(result.get())
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function findAndGroupByCategories(req: Request, res: Response) {
  try {
    const query = req.query
    const result = await productService.findAndGroupByCategories(query)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function create(req: Request, res: Response) {
  try {
    const product = new ProductCreateRequest(req.body)
    const createdProduct = await productService.create(product)
    res.status(200).send(createdProduct)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function createFamily(req: Request, res: Response) {
  try {
    const { name, category, subcategory } = req.body
    const productFamily = new ProductFamilyCreateRequest({ name, category, subcategory })
    const result = await productFamilyService.create(productFamily)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function update(req: Request, res: Response) {
  const id = req.params.id
  const updateRequest = new ProductUpdateRequest(req.body)
  try {
    const product = await productService.update(id, updateRequest)
    res.status(200).json(product)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function updateFamily(req: Request, res: Response) {
  try {
    const id = req.params.id
    const updateRequest = new ProductFamilyUpdateRequest(req.body)
    const updatedFamily = productFamilyService.update(id, updateRequest)
    res.status(200).send(updatedFamily)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function deleteFamily(req: Request, res: Response) {
  try {
    const family_id = req.params.id
    const result = await productFamilyService.deleteById(family_id)
    res.status(200).send(result)
  } catch (error) {
    console.error(error)
  }
}

export async function deleteProduct(req: Request, res: Response) {
  try {
    const id = req.params.id
    const result = await productService.deleteById(id)
    res.status(200).send(result)
  } catch (error) {
    console.error(error)
  }
}

// Product Categories
export async function findCategories(req: Request, res: Response) {
  try {
    const result = await productFamilyService.findCategories()
    res.status(200).json(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Subcategories
export async function findSubcategories(req: Request, res: Response) {
  try {
    let category: string | undefined
    if (req.query && req.query.category) {
      category = req.query.category as string
    }
    const result = await productFamilyService.findSubcategories(category)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Names
export async function findNames(req: Request, res: Response) {
  const query = req.query || {}
  try {
    const result = await productFamilyService.findFamilyNames(req.query)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Colors
export async function findColors(req: Request, res: Response) {
  const query = req.query || {}
  try {
    const result = await productFamilyService.findFamilyColors(query)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

// Product Sizes
export async function findSizes(req: Request, res: Response) {
  const query = req.query || {}
  try {
    const result = await productFamilyService.findFamilyColors(query)
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}
