const express = require('express')
const router = express.Router()
const products = require('../controllers/products')
const validator = require('../validators/products')

router.get('/', products.find)
router.post('/', validator.create, products.create)
router.patch('/:id', validator.update, products.update)
router.delete('/:id', products.deleteProduct)

router.get('/families', products.findFamilies)
router.get('/families/:id', products.findFamily)
router.post('/families', validator.createFamily, products.createFamily)
router.put('/families/:id', validator.updateFamily, products.updateFamily)
router.delete('/families/:id', products.deleteFamily)

router.get('/grouped/categories', products.findAndGroupByCategories)
router.get('/categories', products.findCategories)
router.get('/subcategories', products.findSubcategories)
router.get('/names', products.findNames)
router.get('/sizes', products.findSizes)
router.get('/colors', products.findColors)

module.exports = router
