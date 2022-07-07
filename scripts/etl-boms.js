const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { backupDb, nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const boms = await backupDb
      .collection('boms')
      .aggregate([
        { $unwind: '$materials' },
        {
          $project: {
            _id: {
              product_id: { $toObjectId: '$product_id' },
              material_id: { $toObjectId: '$materials.material_id' },
            },
            product_id: { $toString: '$product_id' },
            material_id: { $toString: '$materials.material_id' },
            quantity: '$materials.quantity',
          },
        },
      ])
      .toArray()

    const { result } = await nudeDb
      .collection('materials.consumption')
      .insertMany(boms)

    console.log(boms[0])
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
