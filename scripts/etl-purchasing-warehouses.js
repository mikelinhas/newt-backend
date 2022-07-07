const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { backupDb, nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const purchasingWarehouses = await backupDb
      .collection('purchasing.warehouses')
      .aggregate([])
      .toArray()

    const { result } = await nudeDb
      .collection('purchasing.warehouses')
      .insertMany(purchasingWarehouses)
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
