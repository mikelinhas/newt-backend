const express = require('express')
const router = express.Router()
const producers = require('../controllers/producers')
const validator = require('../validators/producers')

router.get('/', producers.findProducers)
router.get('/:id', producers.findProducer)
router.put('/:id', producers.updateProducer)
router.delete('/:id', producers.deleteProducer)
router.post('/', validator.create, producers.createProducer)

module.exports = router
