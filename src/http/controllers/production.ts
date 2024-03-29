import { Request, Response } from "express"
import { ObjectId } from "mongodb"
import { getDatabaseConnection } from "../../database/utils"
import { ProductionOrder } from "../models/production"
import { errorHandler } from "./utils/errors"

const database = require('../../database/utils')
const { WarehouseMaterial } = require('../models/materials')
const logs = require('./logs')

const db = getDatabaseConnection()

// Products
export async function findOrders(req: Request, res: Response) {
  try {
    const result = await db
      .collection('production')
      .find()
      .sort({ date: -1 })
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function findOrder(req: Request, res: Response) {
  try {
    const order_number = req.params.order_number
    const result = await db.collection('production').findOne({ order_number })
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function getOrderMaterialConsumption(req: Request, res: Response) {
  try {
    const order_number = req.params.order_number
    const result = await db
      .collection('production')
      .aggregate([
        { $match: { order_number } },
        { $unwind: '$items' },
        { $replaceRoot: { newRoot: '$items' } },
        {
          $project: {
            _id: { $toObjectId: '$product_id' },
            product_id: 1,
            ordered: 1,
            finished: 1,
            in_production: { $subtract: ['$ordered', '$finished'] },
          },
        },
        { $match: { in_production: { $gt: 0 } } },
        // now we have a list of products with in_production value
        {
          $lookup: {
            from: 'materials.consumption',
            let: { productId: '$product_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$product_id', '$$productId'],
                  },
                },
              },
            ],
            as: 'boms',
          },
        },
        { $unwind: '$boms' },
        {
          $project: {
            _id: { $toObjectId: '$boms.material_id' },
            material_id: 1,
            quantity: {
              $multiply: ['$in_production', '$boms.quantity'],
            },
          },
        },
        {
          $group: {
            _id: '$_id',
            quantity: { $sum: '$quantity' },
          },
        },
        {
          $lookup: {
            from: 'materials',
            let: { materialId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$_id', '$$materialId'],
                  },
                },
              },
            ],
            as: 'material_info',
          },
        },
        {
          $project: {
            name: { $first: '$material_info.name' },
            description: { $first: '$material_info.description' },
            external_ref: { $first: '$material_info.external_ref' },
            unit_price: { $first: '$material_info.unit_price' },
            measure_unit: { $first: '$material_info.measure_unit' },
            supplier_id: { $first: '$material_info.supplier_id' },
            quantity: 1,
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray()
    res.status(200).send(result)
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function createOrder(req: Request, res: Response) {
  try {
    const { producer_id, producer_name, items } = req.body.order
    const newOrderNumber = await getNewOrderNumber(producer_id)
    const order = new ProductionOrder({
      order_number: newOrderNumber,
      producer_id,
      producer_name,
      items,
    })
    await db.collection('production').insertOne(order)
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

async function getNewOrderNumber(producer_id: any) {
  const { name } = await db
    .collection('producers')
    .findOne({ _id: producer_id }) as any
  const producerInitials = name.substring(0, 3).toUpperCase()
  const orders = await db
    .collection('production')
    .find({ producer_id })
    .toArray()
  const highest = orders.reduce((highest, order) => {
    const orderNumber = order.order_number
    const number = Number(orderNumber.substr(orderNumber.length - 4))
    if (number > highest) {
      return number
    } else {
      return highest
    }
  }, 0)
  const newHighest = highest + 1
  const num = '000' + newHighest
  const paddedNumber = num.substr(num.length - 4)
  const newOrderNumber = producerInitials + '-' + paddedNumber
  return newOrderNumber
}

export async function updateOrder(req: Request, res: Response) {
  try {
    const update = req.body
    const id = new ObjectId(req.params.id)
    const result = await db
      .collection('production')
      .updateOne({ _id: id }, { $set: update }, { upsert: false })
    if (result.modifiedCount) {
      const order = await db.collection('production').findOne({ _id: id })
      res.status(200).send(order)
    } else {
      throw new Error('Not modified correctly')
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

export async function modifyOrderQuantity(req: Request, res: Response) {
  try {
    const { product_id, quantity } = req.body
    const id = new ObjectId(req.params.id)
    await modifyOrderField(id, product_id, 'ordered', quantity)
    await modifyOrderDate(id)
    const order = await db.collection('production').findOne({ _id: id })
    res.status(200).send(order)
  } catch (error) {
    errorHandler(error, res)
  }
}

function getPreviousFinished(order: any, product_id: any) {
  const product = order.items.find((item: any) => item.product_id === product_id)
  return product.finished
}

async function subtractMaterials(order: any, product_id: any, difference: number) {
  const { producer_id: warehouse_id, order_number } = order
  const materials = await db
    .collection('materials.consumption')
    .find({ product_id })
    .toArray()
  await Promise.all(
    materials.map(async (material) => {
      const change = -material.quantity * difference
      const material_id = String(material.material_id)
      const warehouse = await db
        .collection('materials.stock')
        .findOne({ warehouse_id, material_id })
      if (warehouse) {
        await db
          .collection('materials.stock')
          .updateOne(
            { warehouse_id, material_id },
            { $inc: { stock: change } },
            { upsert: false }
          )
      } else {
        const warehouseEntry = new WarehouseMaterial({
          warehouse_id,
          stock: change,
          material_id,
        })
        await db.collection('materials.stock').insertOne(warehouseEntry)
      }
      await logs.logMaterialConsumption({
        material_id,
        change,
        warehouse_id,
        order_number,
        product_id,
        product_quantity: difference,
      })
    })
  )
}

export async function modifyOrderFinished(req: Request, res: Response) {
  try {
    const { product_id, quantity } = req.body
    const id = new ObjectId(req.params.id)
    const order = await db.collection('production').findOne({ _id: id })
    const previousFinished = getPreviousFinished(order, product_id)
    const difference = quantity - previousFinished

    await modifyOrderField(id, product_id, 'finished', quantity)

    if (difference !== 0) {
      await subtractMaterials(order, product_id, difference)
    }

    const modifiedOrder = await db.collection('production').findOne({ _id: id })
    res.status(200).send(modifiedOrder)
  } catch (error) {
    errorHandler(error, res)
  }
}
async function modifyOrderField(id: ObjectId, product_id: any, field: string, quantity: number) {
  const fieldToModify = 'items.$.' + field
  const result = await db.collection('production').updateOne(
    {
      _id: id,
      items: {
        $elemMatch: {
          product_id,
        },
      },
    },
    { $set: { [fieldToModify]: quantity } },
    { upsert: false }
  )
  if (!result.acknowledged) {
    throw new Error('Not modified correctly')
  }
}

async function modifyOrderDate(id: any) {
  const result = await db.collection('production').updateOne(
    {
      _id: id,
    },
    { $addToSet: { modified_at: new Date() } },
    { upsert: false }
  )
  if (!result.acknowledged) {
    throw new Error('Not modified correctly')
  }
}

export async function deleteOrder(req: Request, res: Response) {
  try {
    const id = new ObjectId(req.params.id)
    const { deletedCount } = await db
      .collection('production')
      .deleteOne({ _id: id })
    if (deletedCount) {
      res.status(200).send({ deletedCount })
    } else {
      throw new Error('Not deleted correctly')
    }
  } catch (error) {
    errorHandler(error, res)
  }
}

