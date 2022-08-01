import { Router } from 'express'
import * as boms from '../controllers/boms'
import * as validator from '../validators/boms'

export const BillOfMaterialsRouter: Router = Router();

BillOfMaterialsRouter.get('/table', validator.query, boms.getBOMForTable)
BillOfMaterialsRouter.get('/:product_id', boms.findBOM)
BillOfMaterialsRouter.patch('/:product_id', validator.update, boms.updateBOM)

