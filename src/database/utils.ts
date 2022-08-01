import { Db, MongoClient } from "mongodb"

let DB_URL: string
let DB_NAME: string

if (process.env.NODE_ENV === 'development') {
  console.log('Using local DB')
  DB_URL = process.env.DEV_MONGO_URL as string
  DB_NAME = process.env.DEV_DB_NAME as string
}

if (process.env.NODE_ENV === 'staging') {
  console.log(
    '\x1B[33m',
    'Caution: Using production DB for staging',
    '\x1B[30m'
  )
  DB_URL = process.env.STAG_MONGO_URL as string
  DB_NAME = process.env.STAG_DB_NAME as string
}

if (process.env.NODE_ENV === 'production') {
  console.log('\x1B[33m', 'Caution: Using production DB', '\x1B[30m')
  DB_URL = process.env.PROD_MONGO_URL as string
  DB_NAME = process.env.PROD_DB_NAME as string
}

let DB: Db

export function getDatabaseConnection() {
  return DB
}

// CONNECTION to DATABASE
export async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB...\n')
    const client = await MongoClient.connect(DB_URL)
    DB = client.db(DB_NAME)
    return client.db(DB_NAME)
  } catch (error) {
    console.log(error)
    console.error("Oh no! Could not connect to the database. Exiting process..")
    process.exit(1);
  }
}

