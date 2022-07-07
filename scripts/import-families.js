const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { developmentDb, nudeDb } = await connectToMongo('nude', 'etltest')
    console.log('Yay! Connected to DB')

    const families = await developmentDb
      .collection('products.families')
      .aggregate([])
      .toArray()

    console.log(families[0])

    const { result } = await nudeDb
      .collection('products.families')
      .insertMany(families)
    console.log(result)

    process.exit()
  } catch (error) {
    console.error(error)
    process.exit()
  }
}

async function connectToMongo(developmentName, currentName) {
  const DB_URL = process.env.DEV_MONGO_URL

  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  return {
    developmentDb: client.db(developmentName),
    nudeDb: client.db(currentName),
  }
}

start()
