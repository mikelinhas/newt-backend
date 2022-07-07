const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { backupDb, nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const products = await backupDb
      .collection('stock')
      .aggregate([
        {
          $addFields: { enabled: true },
        },
      ])
      .toArray()

    const families = await nudeDb
      .collection('products.families')
      .aggregate([])
      .toArray()

    // const modifiedProducts = products.map((product) => {
    //   const matchingFamily = families.find((family) => {})
    // })

    console.log(products[0])
    console.log(families[0])

    // const { result } = await nudeDb.collection('suppliers').insertMany(suppliers)
    // console.log(result)

    process.exit()
  } catch (error) {
    console.error(error)
    process.exit()
  }
}

async function connectToMongo(backupName, currentName) {
  const DB_URL = process.env.DEV_MONGO_URL

  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  return { backupDb: client.db(backupName), nudeDb: client.db(currentName) }
}

start()
