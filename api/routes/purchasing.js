const express = require('express')
const router = express.Router()
const purchasing = require('../controllers/purchasing')
const validator = require('../validators/purchasing')

router.get('/orders', purchasing.findOrders)
router.get('/orders/:purchase_number', purchasing.findOrder)
router.get(
  '/orders/:purchase_number/warehouses',
  purchasing.findOrderWarehouses
)
router.put('/orders/:id', purchasing.updateOrder)
router.post('/orders', validator.create, purchasing.createPurchaseOrder)
router.post(
  '/orders/:purchase_number/warehouses/received',
  purchasing.createOrderWarehouseReceived
)
router.patch(
  '/orders/:purchase_number/warehouses/received',
  purchasing.updateOrderWarehouseReceived
)
router.patch('/orders/:id/delivery', purchasing.updateOrderDeliveryDate)
router.patch('/orders/:id/ordered', purchasing.updateOrderQuantity)
router.patch('/orders/:id/price', purchasing.updateOrderPrice)
router.delete('/orders/:id', purchasing.deleteOrder)

module.exports = router
