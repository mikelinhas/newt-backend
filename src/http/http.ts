import express, { NextFunction, Request, Response } from 'express'
import morgan from 'morgan'
import json2xls from 'json2xls'
import { checkToken, invalidateToken, loginToken } from "./auth/jwt"
import { HttpServices } from "../app"
import { ProductRouter } from "./routes/products"
import { LogsRouter } from './routes/logs'
import { BillOfMaterialsRouter } from './routes/boms'
import { MaterialsRouter } from './routes/materials'
import { ProductionRouter } from './routes/production'
import { ProductionDraftsRouter } from './routes/productionDrafts'
import { PurchasingRouter } from './routes/purchasing'
import { ProducersRouter } from './routes/producers'
import { SuppliersRouter } from './routes/suppliers'
import { DataRouter } from './routes/data'

const app = express()

const port = process.env.PORT || 5000

require('dotenv').config()

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json({ limit: '50mb' }))

/**
 * Allow CORS
 */

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET')
    return res.status(200).json({})
  }
  next()
})

function TeapotResponse(req: Request, res: Response) {
  const number = Math.floor(Math.random() * 10)
  if (number < 2) {
    res.status(418).json({
      message:
        'I refuse to brew you coffee because I am, permanently, a teapot.',
    })
  } else {
    res.status(404).json()
  }
}

export function startHttpApi(services: HttpServices) {

  app.post('/login', loginToken)
  app.post('/logout', invalidateToken)

  app.use(checkToken)
  app.get('/user')
  app.use('/logs', LogsRouter)
  app.use('/boms', BillOfMaterialsRouter)
  app.use('/materials', MaterialsRouter)
  app.use('/products', ProductRouter(services))
  app.use('/production', ProductionRouter)
  app.use('/production-drafts', ProductionDraftsRouter)
  app.use('/purchasing', PurchasingRouter)
  app.use('/producers', ProducersRouter)
  app.use('/suppliers', SuppliersRouter)

  app.use('/data', DataRouter)

  app.use(json2xls.middleware)

  app.use('*', TeapotResponse)

  app.listen(port, () => {
    console.log(`🚀  Server is up and listening on port ${port} \n`)
  })

}

