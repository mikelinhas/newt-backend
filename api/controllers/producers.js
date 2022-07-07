const models = require('../models/producers')
const database = require('./../../database/utils')
const db = database.getDatabaseConnection()

const findProducers = async function (req, res) {
  try {
    const result = await db.collection('producers').find().toArray()
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const findProducer = async function (req, res) {
  try {
    const id = req.params.id
    const producer = await db.collection('producers').findOne({ _id: id })
    res.status(200).send(producer)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const updateProducer = async function (req, res) {
  try {
    const id = req.params.id
    const producer = new models.Producer(req.body.producer)
    delete producer._id
    const { result } = await db
      .collection('producers')
      .replaceOne({ _id: id }, producer)
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const deleteProducer = async function (req, res) {
  try {
    const id = req.params.id
    const { result } = await db.collection('producers').deleteOne({ _id: id })
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

const createProducer = async function (req, res) {
  try {
    const producer = new models.Producer(req.body.producer)
    const { result } = await db.collection('producers').insertOne(producer)
    console.log(result)
    res.status(200).send(producer)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

module.exports = {
  findProducers,
  findProducer,
  createProducer,
  updateProducer,
  deleteProducer,
}
