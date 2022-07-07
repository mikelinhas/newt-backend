const express = require('express')
const router = express.Router()
const suppliers = require('../controllers/suppliers')
const validator = require('../validators/suppliers')

router.get('/', suppliers.findSuppliers)
router.get('/:id', suppliers.findSupplier)
router.get('/:id/materials', suppliers.findSupplierMaterials)
router.put('/:id', suppliers.updateSupplier)
router.delete('/:id', suppliers.deleteSupplier)
router.post('/', validator.create, suppliers.createSupplier)

module.exports = router
