import { Request, Response } from "express"
import { getDatabaseConnection } from "../../database/utils"
import { Producer } from "../models/producers"

const db = getDatabaseConnection()

export async function findProducers(req: Request, res: Response) {
  try {
    const result = await db.collection('producers').find().toArray()
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function findProducer(req: Request, res: Response) {
  try {
    const id = req.params.id
    const producer = await db.collection('producers').findOne({ _id: id })
    res.status(200).send(producer)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function updateProducer(req: Request, res: Response) {
  try {
    const id = req.params.id
    const producer = new Producer(req.body.producer)
    // delete producer._id
    const result = await db
      .collection('producers')
      .replaceOne({ _id: id }, producer)
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function deleteProducer(req: Request, res: Response) {
  try {
    const id = req.params.id
    const result = await db.collection('producers').deleteOne({ _id: id })
    res.status(200).send(result)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}

export async function createProducer(req: Request, res: Response) {
  try {
    const producer = new Producer(req.body.producer)
    const result = await db.collection('producers').insertOne(producer)
    console.log(result)
    res.status(200).send(producer)
  } catch (err) {
    console.log(err)
    res.status(500).send(err)
  }
}
