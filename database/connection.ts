import { MongoClient, Db } from "mongodb"

const DB_URL = process.env.MongoDBUrl
const DB_NAME = 'azure-test'

let DB: Db

export async function getDatabaseConnection() {
  if (!DB) {
    await connectToDatabase()
  }
  return DB
}

// CONNECTION to DATABASE
export async function connectToDatabase() {
  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL)
  DB = client.db(DB_NAME)
  console.log('Yay!! Connected to MongoDB')
  return client.db(DB_NAME)
}
