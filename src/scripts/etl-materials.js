const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { backupDb, nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const materials = await backupDb
      .collection('materials')
      .aggregate([
        {
          $project: {
            name: 1,
            description: 1,
            measure_unit: 1,
            unit_price: 1,
            external_ref: 1,
            supplier_id: 1,
          },
        },
      ])
      .toArray()

    const { result } = await nudeDb
      .collection('materials')
      .insertMany(materials)

    console.log(materials[0])
    console.log(result)
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
