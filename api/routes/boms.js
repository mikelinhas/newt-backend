const express = require('express')
const router = express.Router()
const boms = require('../controllers/boms')
const validator = require('../validators/boms')

router.get('/table', validator.query, boms.getBOMForTable)
router.get('/:product_id', boms.findBOM)
router.patch('/:product_id', validator.update, boms.updateBOM)
module.exports = router
