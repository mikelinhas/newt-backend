import { Router } from "express"
import * as validator from "../validators/purchasing"
import * as controller from "../controllers/purchasing"

export const PurchasingRouter = Router()

PurchasingRouter.get('/orders', controller.findOrders)
PurchasingRouter.get('/orders/:purchase_number', controller.findOrder)
PurchasingRouter.get(
  '/orders/:purchase_number/warehouses',
  controller.findOrderWarehouses
)
PurchasingRouter.put('/orders/:id', controller.updateOrder)
PurchasingRouter.post('/orders', validator.create, controller.createPurchaseOrder)
PurchasingRouter.post(
  '/orders/:purchase_number/warehouses/received',
  controller.createOrderWarehouseReceived
)
PurchasingRouter.patch(
  '/orders/:purchase_number/warehouses/received',
  controller.updateOrderWarehouseReceived
)
PurchasingRouter.patch('/orders/:id/delivery', controller.updateOrderDeliveryDate)
PurchasingRouter.patch('/orders/:id/ordered', controller.updateOrderQuantity)
PurchasingRouter.patch('/orders/:id/price', controller.updateOrderPrice)
PurchasingRouter.delete('/orders/:id', controller.deleteOrder)

