import { Router } from 'express'
import { HttpServices } from '../../app'
import * as controller from '../controllers/products'
import * as validator from '../validators/products'

export function ProductRouter(services: HttpServices) {

  const router = Router()

  controller.initializeServices(services)

  router.get('/', controller.find)
  router.post('/', validator.create, controller.create)
  router.patch('/:id', validator.update, controller.update)
  router.delete('/:id', controller.deleteProduct)

  router.get('/families', controller.findFamilies)
  router.get('/families/:id', controller.findFamily)
  router.post('/families', validator.createFamily, controller.createFamily)
  router.put('/families/:id', validator.updateFamily, controller.updateFamily)
  router.delete('/families/:id', controller.deleteFamily)

  router.get('/grouped/categories', controller.findAndGroupByCategories)
  router.get('/categories', controller.findCategories)
  router.get('/subcategories', controller.findSubcategories)
  router.get('/names', controller.findNames)
  router.get('/sizes', controller.findSizes)
  router.get('/colors', controller.findColors)

  return router
}
