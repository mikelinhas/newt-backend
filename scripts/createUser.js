const prompt = require('prompt')
const MongoClient = require('mongodb').MongoClient
require('dotenv').config()

const bcrypt = require('bcrypt')
const saltRounds = 10

const properties = [
  {
    name: 'environment',
  },
  {
    name: 'username',
  },
  {
    name: 'user',
  },
  {
    name: 'role',
  },
  {
    name: 'password',
  },
]

prompt.start()

prompt.get(properties, async function (err, result) {
  if (err) {
    return onErr(err)
  }
  const db = await connectToDatabase(result.environment)
  console.log('Yay! Connected to DB')

  const salt = bcrypt.genSaltSync(saltRounds)
  const passwordHash = bcrypt.hashSync(result.password, salt)

  const user = {
    username: result.username,
    user: result.user,
    password: passwordHash,
    role: result.role,
  }
  const dbResult = await db.collection('users').insertOne(user)
  console.log(dbResult.result)
  console.log('Saved the user')

  process.exit()
})

function onErr(err) {
  console.log(err)
  process.exit()
}

async function connectToDatabase(env) {
  let DB_URL
  let DB_NAME

  if (env === 'development') {
    console.log('Using local DB')
    DB_URL = process.env.DEV_MONGO_URL
    DB_NAME = process.env.DEV_DB_NAME
  }

  if (env === 'staging') {
    console.log(
      '\x1B[33m',
      'Caution: Using production DB for staging',
      '\x1B[30m'
    )
    DB_URL = process.env.STAG_MONGO_URL
    DB_NAME = process.env.STAG_DB_NAME
  }

  if (env === 'production') {
    console.log('\x1B[33m', 'Caution: Using production DB', '\x1B[30m')
    DB_URL = process.env.PROD_MONGO_URL
    DB_NAME = process.env.PROD_DB_NAME
  }

  console.log('Connecting to MongoDB...\n')
  const client = await MongoClient.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  return client.db(DB_NAME)
}
