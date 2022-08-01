import { Router } from 'express'
import * as data from '../controllers/data'

export const DataRouter = Router()

DataRouter.get('/export/products', data.exportProducts)
DataRouter.post('/import/products', data.importProducts)

