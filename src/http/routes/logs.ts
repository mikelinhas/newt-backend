import { Router } from 'express'
import * as validator from '../validators/logs'
import * as logs from '../controllers/logs'

export const LogsRouter = Router()

LogsRouter.get(
  '/materials/:material_id',
  validator.findMaterialLogs,
  logs.findMaterialLogs
)
