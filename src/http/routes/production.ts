import { Router } from "express"
import * as validator from "../validators/production"
import * as controller from "../controllers/production"

export const ProductionRouter = Router()

ProductionRouter.get('/orders', controller.findOrders)
ProductionRouter.get('/orders/:order_number', controller.findOrder)
ProductionRouter.get(
  '/orders/:order_number/materials',
  controller.getOrderMaterialConsumption
)
ProductionRouter.post('/orders', validator.create, controller.createOrder)
ProductionRouter.put('/orders/:id', controller.updateOrder)
ProductionRouter.patch('/orders/:id/ordered', controller.modifyOrderQuantity)
ProductionRouter.patch('/orders/:id/finished', controller.modifyOrderFinished)
ProductionRouter.delete('/orders/:id', controller.deleteOrder)

