import { Router } from "express"
import * as validator from "../validators/suppliers"
import * as controller from "../controllers/suppliers"

export const SuppliersRouter = Router()

SuppliersRouter.get('/', controller.findSuppliers)
SuppliersRouter.get('/:id', controller.findSupplier)
SuppliersRouter.get('/:id/materials', controller.findSupplierMaterials)
SuppliersRouter.put('/:id', controller.updateSupplier)
SuppliersRouter.delete('/:id', controller.deleteSupplier)
SuppliersRouter.post('/', validator.create, controller.createSupplier)

