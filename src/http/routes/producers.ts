import { Router } from 'express'
import * as validator from '../validators/producers'
import * as controller from '../controllers/producers'

export const ProducersRouter = Router()

ProducersRouter.get('/', controller.findProducers)
ProducersRouter.get('/:id', controller.findProducer)
ProducersRouter.put('/:id', controller.updateProducer)
ProducersRouter.delete('/:id', controller.deleteProducer)
ProducersRouter.post('/', validator.create, controller.createProducer)

