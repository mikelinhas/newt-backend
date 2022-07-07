const express = require('express')
const router = express.Router()
const data = require('../controllers/data')

router.get('/export/products', data.exportProducts)
router.post('/import/products', data.importProducts)

module.exports = router
