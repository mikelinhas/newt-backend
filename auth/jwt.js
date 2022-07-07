const jwt = require('jsonwebtoken')
const mongo = require('mongodb')
const bcrypt = require('bcrypt')
const database = require('./../database/utils')
const db = database.getDatabaseConnection()

require('dotenv').config()

const SECRET = process.env.SECRET

const invalidateToken = (req, res) => {
  res.status(200).send('sure, whateva...')
}

const getUser = async (req, res) => {
  try {
    const _id = mongo.ObjectId(req.user)
    const user = await db.collection('users').findOne({ _id })
    delete user.password
    res.status(200).json({ user })
  } catch (error) {
    console.error(error)
    res.status(500).json({})
  }
}

const checkToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (authHeader) {
    const token = authHeader.split(' ')[1]
    jwt.verify(token, SECRET, (err, info) => {
      if (err) {
        return res.sendStatus(403)
      }
      req.user = info.user
      next()
    })
  } else {
    res.sendStatus(401)
  }
}

const loginToken = async (req, res) => {
  try {
    const { username, password } = req.body
    const user = await db.collection('users').findOne({ username })

    if (username && password) {
      const match = await bcrypt.compare(password, user.password)

      if (match) {
        const token = jwt.sign({ user: user._id }, SECRET, {
          expiresIn: '360d', // expires in 360d
        })
        res.status(200).json({
          message: 'Authentication successful!',
          token,
        })
      } else {
        res.status(403).json({
          message: 'Incorrect username or password',
        })
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Authentication failed! Please check the request',
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({})
  }
}

module.exports = { checkToken, loginToken, getUser, invalidateToken }
