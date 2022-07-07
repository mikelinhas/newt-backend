const express = require('express')
const app = express()
const morgan = require('morgan')
const json2xls = require('json2xls')

const database = require('./database/utils')

require('dotenv').config()

app.use(morgan('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.json({ limit: '50mb' }))

/**
 * Allow CORS
 */

app.use((req, res, next) => {
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

const TeapotResponse = (req, res) => {
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

/**
 * Connect to MongoDB before requiring routes
 * to access DB object in all controllers
 */

const start = async () => {
  await database.connectToDatabase()

  console.log('🌱  Connected to MongoDB! Yay!\n')

  const auth = require('./auth/jwt')

  const billOfMaterialRoutes = require('./api/routes/boms')
  const logRoutes = require('./api/routes/logs')
  const dataRoutes = require('./api/routes/data')
  const materialRoutes = require('./api/routes/materials')
  const productRoutes = require('./api/routes/products')
  const productionRoutes = require('./api/routes/production')
  const productionDraftsRoutes = require('./api/routes/productionDrafts')
  const purchasingRoutes = require('./api/routes/purchasing')
  const producerRoutes = require('./api/routes/producers')
  const supplierRoutes = require('./api/routes/suppliers')

  app.post('/login', auth.loginToken)
  app.post('/logout', auth.invalidateToken)
  app.get('/user', auth.checkToken, auth.getUser)
  app.use('/logs', auth.checkToken, logRoutes)
  app.use('/boms', auth.checkToken, billOfMaterialRoutes)
  app.use('/materials', auth.checkToken, materialRoutes)
  app.use('/products', auth.checkToken, productRoutes)
  app.use('/production', auth.checkToken, productionRoutes)
  app.use('/production-drafts', auth.checkToken, productionDraftsRoutes)
  app.use('/purchasing', auth.checkToken, purchasingRoutes)
  app.use('/producers', auth.checkToken, producerRoutes)
  app.use('/suppliers', auth.checkToken, supplierRoutes)

  app.use(json2xls.middleware)
  app.use('/data', auth.checkToken, dataRoutes)

  app.use('*', auth.checkToken, TeapotResponse)

  console.log(`🚀  Server is up and listening \n`)
}

start()

module.exports = app
