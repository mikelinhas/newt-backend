const MongoClient = require('mongodb').MongoClient
require('dotenv').config()
let DB_URL
let DB_NAME
if (process.env.NODE_ENV === 'development') {
  console.log('Using local DB')
  DB_URL = process.env.DEV_MONGO_URL
  DB_NAME = process.env.DEV_DB_NAME
}

if (process.env.NODE_ENV === 'staging') {
  console.log(
    '\x1B[33m',
    'Caution: Using production DB for staging',
    '\x1B[30m'
  )
  DB_URL = process.env.STAG_MONGO_URL
  DB_NAME = process.env.STAG_DB_NAME
}

if (process.env.NODE_ENV === 'production') {
  console.log('\x1B[33m', 'Caution: Using production DB', '\x1B[30m')
  DB_URL = process.env.PROD_MONGO_URL
  DB_NAME = process.env.PROD_DB_NAME
}

let DB

const getDatabaseConnection = () => {
  return DB
}

// CONNECTION to DATABASE
const connectToDatabase = async () => {
  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  DB = client.db(DB_NAME)
  return client.db(DB_NAME)
}

module.exports = { connectToDatabase, getDatabaseConnection }
