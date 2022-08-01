const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { backupDb, nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const purchasingOrders = await backupDb
      .collection('purchasing')
      .aggregate([])
      .toArray()

    const modifiedOrders = purchasingOrders.map((order) => {
      order.closed = Boolean(order.closed)
      order.modified_at = []
      order.delivery_date = []
      return order
    })

    console.log(modifiedOrders[6])

    const { result } = await nudeDb
      .collection('purchasing')
      .insertMany(modifiedOrders)
    console.log(result)

    process.exit()
  } catch (error) {
    console.error(error)
    process.exit()
  }
}

async function connectToMongo(backupName, currentName) {
  const DB_URL = process.env.DEV_MONGO_URL
  // const PROD_DB_URL = process.env.PROD_MONGO_URL

  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  // console.log('Connecting to production MongoDB...\n')
  // const productionClient = await MongoClient.connect(PROD_DB_URL, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  // })

  return { backupDb: client.db(backupName), nudeDb: client.db(currentName) }
}

start()
