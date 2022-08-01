import { Router } from 'express'
import * as validator from '../validators/materials'
import * as controller from '../controllers/materials'

export const MaterialsRouter = Router();

MaterialsRouter.get('/', controller.findMaterials)
MaterialsRouter.get('/measureunits', controller.findMeasureUnits)
MaterialsRouter.get('/stock', validator.query, controller.findStock)
MaterialsRouter.get('/:id', controller.findMaterial)
MaterialsRouter.post(
  '/:id/warehouse',
  validator.createWarehouseEntry,
  controller.createWarehouseEntry
)
MaterialsRouter.patch(
  '/:id/warehouse',
  validator.updateWarehouseEntry,
  controller.updateWarehouseEntry
)
MaterialsRouter.post('/', validator.create, controller.createMaterial)
MaterialsRouter.put('/:id', validator.update, controller.updateMaterial)
MaterialsRouter.delete('/:id', controller.deleteMaterial)
