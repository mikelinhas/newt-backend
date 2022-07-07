const express = require('express')
const router = express.Router()
const materials = require('../controllers/materials')
const validator = require('../validators/materials')

router.get('/', materials.findMaterials)
router.get('/measureunits', materials.findMeasureUnits)
router.get('/stock', validator.query, materials.findStock)
router.get('/:id', materials.findMaterial)
router.post(
  '/:id/warehouse',
  validator.createWarehouseEntry,
  materials.createWarehouseEntry
)
router.patch(
  '/:id/warehouse',
  validator.updateWarehouseEntry,
  materials.updateWarehouseEntry
)
router.post('/', validator.create, materials.createMaterial)
router.put('/:id', validator.update, materials.updateMaterial)
router.delete('/:id', materials.deleteMaterial)

module.exports = router
