const express = require('express')
const router = express.Router()
const logs = require('../controllers/logs')
const validator = require('../validators/logs')

router.get(
  '/materials/:material_id',
  validator.findMaterialLogs,
  logs.findMaterialLogs
)
module.exports = router
