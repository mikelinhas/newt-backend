const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

async function start() {
  try {
    const { nudeDb } = await connectToMongo('backup', 'etltest')
    console.log('Yay! Connected to DB')

    const duplicateProducts = await nudeDb
      .collection('products')
      .aggregate([
        {
          $lookup: {
            from: 'products.families',
            let: { familyId: '$family_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: [{ $toObjectId: '$$familyId' }, '$_id'] },
                },
              },
            ],
            as: 'family_info',
          },
        },
        {
          $group: {
            _id: {
              color: '$color',
              family_id: '$family_id',
              size: '$size',
            },
            count: { $sum: 1 },
            family_name: { $first: '$family_info.name' },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray()

    console.log(duplicateProducts)
    process.exit()
  } catch (error) {
    console.error(error)
    process.exit()
  }
}

async function connectToMongo() {
  const DB_URL = process.env.DEV_MONGO_URL

  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })

  return { nudeDb: client.db('nudelabel') }
}

start()
