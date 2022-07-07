const express = require('express')
const router = express.Router()
const production = require('../controllers/production')
const validator = require('../validators/production')

router.get('/orders', production.findOrders)
router.get('/orders/:order_number', production.findOrder)
router.get(
  '/orders/:order_number/materials',
  production.getOrderMaterialConsumption
)
router.post('/orders', validator.create, production.createOrder)
router.put('/orders/:id', production.updateOrder)
router.patch('/orders/:id/ordered', production.modifyOrderQuantity)
router.patch('/orders/:id/finished', production.modifyOrderFinished)
router.delete('/orders/:id', production.deleteOrder)

module.exports = router
